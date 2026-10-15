const MAX_BODY_BYTES = 64 * 1024;
const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_REQUESTS_PER_MINUTE = 20;
const requestCounts = new Map();

function sendJson(response, status, payload) {
  response.status(status).setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.json(payload);
}

function normalizeText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return null;
  }

  const normalized = [];
  for (const message of messages) {
    if (
      !message ||
      !["user", "assistant"].includes(message.role) ||
      typeof message.content !== "string" ||
      !message.content.trim() ||
      message.content.length > MAX_MESSAGE_LENGTH
    ) {
      return null;
    }
    normalized.push({ role: message.role, content: message.content.trim() });
  }
  return normalized;
}

function normalizeProject(project) {
  if (!project || typeof project !== "object" || Array.isArray(project)) {
    return { topic: "", problem: "", audience: "", modules: [] };
  }

  const modules = Array.isArray(project.modules)
    ? project.modules.slice(0, 10).map((module) => ({
        title: normalizeText(module?.title, 120),
        note: normalizeText(module?.note, 1200),
        completed: Boolean(module?.completed),
      }))
    : [];

  return {
    topic: normalizeText(project.topic, 1000),
    problem: normalizeText(project.problem, 1000),
    audience: normalizeText(project.audience, 500),
    language: project.language === "en" ? "en" : "tr",
    modules,
  };
}

function isSameOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return true;

  try {
    const originHost = new URL(origin).host;
    const requestHost = request.headers["x-forwarded-host"] || request.headers.host;
    return Boolean(requestHost) && originHost === requestHost;
  } catch {
    return false;
  }
}

function allowRequest(ipAddress) {
  const now = Date.now();
  const previous = requestCounts.get(ipAddress);
  if (requestCounts.size > 5000) {
    for (const [key, value] of requestCounts) {
      if (now - value.startedAt >= 60_000) requestCounts.delete(key);
    }
  }
  if (!previous || now - previous.startedAt >= 60_000) {
    requestCounts.set(ipAddress, { startedAt: now, count: 1 });
    return true;
  }
  if (previous.count >= MAX_REQUESTS_PER_MINUTE) return false;
  previous.count += 1;
  return true;
}

export const config = { maxDuration: 60 };

export default async function handler(request, response) {
  const language =
    String(request.headers["accept-language"] || "").toLowerCase().startsWith("en")
      ? "en"
      : "tr";
  const message = (turkish, english) => (language === "en" ? english : turkish);

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, {
      error: message("Bu uç nokta yalnızca POST isteği kabul eder.", "This endpoint only accepts POST requests."),
    });
    return;
  }

  if (!isSameOrigin(request)) {
    sendJson(response, 403, {
      error: message("Bu isteğin kaynağına izin verilmiyor.", "Requests from this origin are not allowed."),
    });
    return;
  }

  const contentLength = Number(request.headers["content-length"] || 0);
  if (contentLength > MAX_BODY_BYTES) {
    sendJson(response, 413, {
      error: message("İstek boyutu izin verilen sınırı aşıyor.", "The request body exceeds the allowed size."),
    });
    return;
  }

  const ipAddress = request.headers["x-forwarded-for"]?.split(",")[0]?.trim() || "unknown";
  if (!allowRequest(ipAddress)) {
    sendJson(response, 429, {
      error: message(
        "Çok sık mesaj gönderildi. Bir dakika sonra yeniden deneyin.",
        "Too many messages. Please try again in one minute."
      ),
    });
    return;
  }

  const secret = process.env.CHAT_API_SECRET;
  const workerUrl = process.env.CLOUDFLARE_CHAT_URL;
  if (!secret || !workerUrl) {
    sendJson(response, 503, {
      error: message(
        "Cloudflare AI bağlantısı henüz sunucu ortamında yapılandırılmamış.",
        "The Cloudflare AI connection is not configured on the server yet."
      ),
    });
    return;
  }

  let body = request.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      sendJson(response, 400, {
        error: message("İstek JSON biçiminde olmalıdır.", "The request must contain valid JSON."),
      });
      return;
    }
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    sendJson(response, 400, {
      error: message("İstek gövdesi geçersiz.", "The request body is invalid."),
    });
    return;
  }

  const messages = normalizeMessages(body.messages);
  if (!messages || messages.at(-1).role !== "user") {
    sendJson(response, 400, {
      error: message("Mesaj biçimi geçersiz.", "The message format is invalid."),
    });
    return;
  }

  try {
    const upstream = await fetch(workerUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
        "Accept-Language": language,
        "X-Client-IP": ipAddress,
      },
      signal: AbortSignal.timeout(55_000),
      body: JSON.stringify({ messages, project: normalizeProject(body.project) }),
    });

    const result = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      console.error(`Cloudflare Worker returned HTTP ${upstream.status}.`);
      sendJson(response, upstream.status === 429 ? 429 : 502, {
        error:
          result?.error ||
          message("Cloudflare AI isteği tamamlanamadı.", "The Cloudflare AI request could not be completed."),
      });
      return;
    }

    if (typeof result?.reply !== "string" || !result.reply.trim()) {
      console.error("Cloudflare Worker returned an invalid response.");
      sendJson(response, 502, {
        error: message("Cloudflare AI geçerli bir yanıt döndürmedi.", "Cloudflare AI returned an invalid response."),
      });
      return;
    }

    sendJson(response, 200, { reply: result.reply.trim() });
  } catch (error) {
    console.error(`Cloudflare AI request failed: ${error.name || "Error"}.`);
    sendJson(response, error.name === "TimeoutError" ? 504 : 502, {
      error:
        error.name === "TimeoutError"
          ? message("AI yanıtı zaman aşımına uğradı. Lütfen yeniden deneyin.", "The AI response timed out. Please try again.")
          : message("Cloudflare AI sunucusuna bağlanılamadı.", "Could not connect to the Cloudflare AI server."),
    });
  }
}
