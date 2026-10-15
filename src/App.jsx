import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Check,
  CheckCircle2,
  Copy,
  FileText,
  Globe,
  GraduationCap,
  Instagram,
  Linkedin,
  Menu,
  MessageCircle,
  Send,
  Sparkles,
  Star,
  Trash2,
  UserCheck,
  X,
  Youtube,
} from "lucide-react";
import Login from "./components/Login.jsx";
import { moduleIcons } from "./icons.js";
import {
  ACCESS_PASSWORD,
  assistantModules,
  fillPrompt,
  i18n,
} from "./data.js";
import { getLocalizedContent } from "./localized-content.js";

function Toast({ message, type }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 backdrop-blur-md ${
        type === "success"
          ? "bg-green-500/20 border-green-500/50 text-green-300"
          : "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
      }`}
    >
      {type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
      <span className="font-medium text-sm">{message}</span>
    </motion.div>
  );
}

function readAssistantWorkspace() {
  const emptyWorkspace = {
    info: { topic: "", problem: "", audience: "" },
    done: [],
    notes: {},
    checks: {},
  };

  try {
    const saved = JSON.parse(localStorage.getItem("assistantWorkspace") || "{}");
    return {
      info: {
        ...emptyWorkspace.info,
        ...(saved.info && typeof saved.info === "object" ? saved.info : {}),
      },
      done: Array.isArray(saved.done) ? saved.done : emptyWorkspace.done,
      notes: saved.notes && typeof saved.notes === "object" ? saved.notes : emptyWorkspace.notes,
      checks: saved.checks && typeof saved.checks === "object" ? saved.checks : emptyWorkspace.checks,
    };
  } catch {
    return emptyWorkspace;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export default function App() {
  const [initialWorkspace] = useState(readAssistantWorkspace);
  const [lang, setLang] = useState(() =>
    localStorage.getItem("siteLanguage") === "en" ? "en" : "tr"
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [info, setInfo] = useState(initialWorkspace.info);
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [toasts, setToasts] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [messages, setMessages] = useState([
    {
      text:
        (localStorage.getItem("siteLanguage") || "tr") === "en"
          ? "Hello! I’m your AI Project Coach. How can I help you develop your TÜBİTAK 2209 project idea?"
          : "Merhaba! Ben AI Proje Koçu. 2209 proje fikrini geliştirmek için sana nasıl yardımcı olabilirim?",
      sender: "bot",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEnd = useRef(null);
  const moduleDialogRef = useRef(null);
  const [done, setDone] = useState(() => new Set(initialWorkspace.done));
  const [notes, setNotes] = useState(initialWorkspace.notes);
  const [openModule, setOpenModule] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("favoritePrompts") || "[]");
    } catch {
      return [];
    }
  });
  const [tab, setTab] = useState("assistant");
  const [filter, setFilter] = useState("all");
  const [checks, setChecks] = useState(initialWorkspace.checks);
  const [reviewId, setReviewId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    institution: "",
    participantType: "",
    message: "",
  });
  const [kvkk, setKvkk] = useState(false);
  const t = i18n[lang];
  const u = t.ui;
  const categories = [
    { key: "all", label: u.all },
    { key: "health", label: u.categoryHealth },
    { key: "nursing", label: u.categoryNursing },
    { key: "anesthesia", label: u.categoryAnesthesia },
    { key: "education", label: u.categoryEducation },
    { key: "psychology", label: u.categoryPsychology },
  ];
  const categoryLabel = (key) => categories.find((category) => category.key === key)?.label;
  const {
    audience: localizedAudience,
    trainingModules: localizedTrainingModules,
    timeline: localizedTimeline,
    outcomes: localizedOutcomes,
    coachQuestions: localizedCoachQuestions,
    reviewCriteria: localizedReviewCriteria,
    reviewPrompts: localizedReviewPrompts,
    successfulProjects: localizedSuccessfulProjects,
    checklistItems: localizedChecklistItems,
    assistantModules: localizedAssistantModules,
  } = getLocalizedContent(lang);

  useEffect(() => {
    localStorage.setItem("siteLanguage", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const changeLanguage = () => {
    const nextLanguage = lang === "tr" ? "en" : "tr";
    setLang(nextLanguage);
    setMessages((current) =>
      current.length === 1 && current[0].sender === "bot"
        ? [{
            text:
              nextLanguage === "en"
                ? "Hello! I’m your AI Project Coach. How can I help you develop your TÜBİTAK 2209 project idea?"
                : "Merhaba! Ben AI Proje Koçu. 2209 proje fikrini geliştirmek için sana nasıl yardımcı olabilirim?",
            sender: "bot",
          }]
        : current
    );
  };

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatOpen]);

  useEffect(() => {
    if (openModule !== null && moduleDialogRef.current) {
      moduleDialogRef.current.scrollTop = 0;
    }
  }, [openModule]);

  useEffect(() => {
    const updateScrollPosition = () => setShowBackToTop(window.scrollY > 400);
    updateScrollPosition();
    window.addEventListener("scroll", updateScrollPosition, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollPosition);
  }, []);

  useEffect(() => {
    localStorage.setItem("favoritePrompts", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(
      "assistantWorkspace",
      JSON.stringify({ info, done: [...done], notes, checks })
    );
  }, [info, done, notes, checks]);

  const notify = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((item) => item.id !== id)), 3000);
  };

  const exportProjectReport = (format) => {
    const projectTitle =
      info.topic.trim() || (lang === "tr" ? "TÜBİTAK 2209 Proje Taslağı" : "TÜBİTAK 2209 Project Draft");
    const projectDetails = [
      [u.projectTopic, info.topic],
      [u.problemStatement, info.problem],
      [u.targetAudience, info.audience],
    ]
      .filter(([, value]) => value.trim())
      .map(
        ([label, value]) =>
          `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`
      )
      .join("");
    const moduleDetails = localizedAssistantModules
      .map((module) => {
        const status = done.has(module.id)
          ? (lang === "tr" ? "Tamamlandı" : "Completed")
          : (lang === "tr" ? "Devam ediyor" : "In progress");
        const note = notes[module.id]?.trim();
        return `<section><h2>${escapeHtml(module.title)} <small>— ${status}</small></h2>${
          note
            ? `<p>${escapeHtml(note).replaceAll("\n", "<br />")}</p>`
            : `<p>${lang === "tr" ? "Henüz not eklenmedi." : "No notes added yet."}</p>`
        }</section>`;
      })
      .join("");
    const checklistDetails = localizedChecklistItems
      .map(
        (item, index) =>
          `<li>${checks[index] ? "☑" : "☐"} ${escapeHtml(item)}</li>`
      )
      .join("");
    const reportHtml = `<!doctype html>
      <html lang="${lang}"><head><meta charset="utf-8" />
      <title>${escapeHtml(projectTitle)}</title>
      <style>
        body{font-family:Arial,sans-serif;color:#172033;max-width:800px;margin:40px auto;line-height:1.6;padding:0 24px}
        h1{color:#087e9b;border-bottom:2px solid #16b8d4;padding-bottom:12px}
        h2{color:#164e63;margin-top:28px}small{font-size:13px;color:#64748b;font-weight:normal}
        section{border-bottom:1px solid #dbe4ea;padding-bottom:12px}
        @media print{body{margin:20px auto}}
      </style></head><body>
      <h1>${escapeHtml(projectTitle)}</h1>
      <p><strong>${lang === "tr" ? "Proje tamamlanma oranı" : "Project completion"}:</strong> ${progress}% (${done.size}/10 ${lang === "tr" ? "modül" : "modules"})</p>
      <section><h2>${lang === "tr" ? "Proje Bilgileri" : "Project Details"}</h2>${projectDetails || `<p>${lang === "tr" ? "Henüz proje bilgisi girilmedi." : "No project details have been entered yet."}</p>`}</section>
      ${moduleDetails}
      <section><h2>${u.finalChecklist}</h2><ul>${checklistDetails}</ul></section>
      </body></html>`;

    if (format === "word") {
      const blob = new Blob(["\ufeff", reportHtml], { type: "application/msword" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "tubitak-2209-proje-taslagi.doc";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify(u.wordDownloaded);
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      notify(u.popupRequired, "info");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(reportHtml);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), 500);
  };

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const login = (e) => {
    e.preventDefault();
    if (password === ACCESS_PASSWORD) {
      setDone(new Set());
      setUnlocked(true);
      setError("");
    } else {
      setError(u.wrongPassword);
    }
  };

  const register = (e) => {
    e.preventDefault();
    if (!kvkk) {
      alert(u.registrationRequired);
      return;
    }
    alert(u.registrationSuccess);
    setForm({ name: "", email: "", phone: "", institution: "", participantType: "", message: "" });
    setKvkk(false);
  };

  const sendChat = async (e, override) => {
    if (e) e.preventDefault();
    const text = override || chatInput;
    if (!text.trim() || chatLoading) return;
    const conversation = [...messages, { text, sender: "user" }].slice(-12);
    setMessages(conversation);
    setChatInput("");
    setChatLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": lang,
        },
        body: JSON.stringify({
          messages: conversation.map(({ sender, text: messageText }) => ({
            role: sender === "user" ? "user" : "assistant",
            content: messageText,
          })),
          project: {
            ...info,
            language: lang,
            modules: localizedAssistantModules.map((module) => ({
              title: module.title,
              note: notes[module.id] || "",
              completed: done.has(module.id),
            })),
          },
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || u.chatFailure);
      }
      setMessages((previous) => [...previous, { text: result.reply, sender: "bot" }]);
    } catch (chatError) {
      const message = chatError.message || u.chatConnectionFailure;
      setMessages((previous) => [...previous, { text: message, sender: "bot" }]);
    } finally {
      setChatLoading(false);
    }
  };

  const toggleDone = (id) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        notify(u.moduleUndone, "info");
      } else {
        next.add(id);
        notify(u.moduleDone, "success");
      }
      return next;
    });
  };

  const toggleFavorite = (prompt) => {
    const filled = fillPrompt(prompt.template, info, lang);
    const sourcePrompt =
      assistantModules.find((module) => module.id === prompt.moduleId)?.prompts[prompt.promptIndex];
    const index = favorites.findIndex(
      (item) =>
        (item.moduleId === prompt.moduleId && item.promptIndex === prompt.promptIndex) ||
        item.title === sourcePrompt?.title
    );
    if (index >= 0) {
      setFavorites((prev) => prev.filter((_, i) => i !== index));
      notify(u.promptRemoved, "info");
    } else {
      setFavorites((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          moduleId: prompt.moduleId,
          promptIndex: prompt.promptIndex,
          title: prompt.title,
          text: filled,
        },
      ]);
      notify(u.promptAdded, "success");
    }
  };

  const copyText = async (text) => {
    await navigator.clipboard.writeText(text);
    notify(u.copied, "success");
  };

  const progress = Math.round((done.size / 10) * 100);
  const original = Math.min(25, Math.round((done.size / 10) * 25));
  const method = Math.min(20, Math.round((done.size / 10) * 20));
  const aim = Math.min(20, Math.round((done.size / 10) * 20));
  const apply = Math.min(35, Math.round((done.size / 10) * 35));
  const score = original + method + aim + apply;
  const allChecked = Object.values(checks).filter(Boolean).length === 13;
  const reviewTotal = localizedReviewCriteria.reduce((sum, item) => sum + item.score, 0);
  const activeModule = localizedAssistantModules.find((item) => item.id === openModule);
  const getFavoriteContent = (favorite) => {
    let moduleIndex = assistantModules.findIndex((module) => module.id === favorite.moduleId);
    let promptIndex = Number.isInteger(favorite.promptIndex) ? favorite.promptIndex : -1;
    if (moduleIndex >= 0 && promptIndex >= 0) {
      const localizedPrompt = localizedAssistantModules[moduleIndex]?.prompts[promptIndex];
      if (localizedPrompt) {
        return {
          title: localizedPrompt.title,
          text: fillPrompt(localizedPrompt.template, info, lang),
        };
      }
    }

    for (let index = 0; index < assistantModules.length; index += 1) {
      promptIndex = assistantModules[index].prompts.findIndex((prompt) => prompt.title === favorite.title);
      if (promptIndex >= 0) {
        const localizedPrompt = localizedAssistantModules[index]?.prompts[promptIndex];
        if (localizedPrompt) {
          return {
            title: localizedPrompt.title,
            text: fillPrompt(localizedPrompt.template, info, lang),
          };
        }
      }
    }
    return { title: favorite.title, text: favorite.text };
  };

  if (!unlocked) {
    return (
      <Login
        password={password}
        setPassword={setPassword}
        error={error}
        onSubmit={login}
        lang={lang}
        onToggleLanguage={changeLanguage}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#050810] text-slate-200 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((item) => (
            <Toast key={item.id} message={item.message} type={item.type} />
          ))}
        </AnimatePresence>
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 bg-[#050810]/80 backdrop-blur-md border-b border-[#1e293b]">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <button className="flex items-center gap-2" onClick={() => scrollTo("hero")}>
            <GraduationCap className="w-8 h-8 text-cyan-400" />
            <span className="font-bold text-xl md:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 tracking-tight">
              AI 2209 Akademi
            </span>
          </button>
          <nav className="hidden lg:flex items-center gap-6">
            {t.navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => scrollTo(item.href)}
                className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors"
              >
                {item.label}
              </button>
            ))}
            <div className="h-6 w-px bg-slate-800 mx-2" />
            <button
              onClick={changeLanguage}
              className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              <Globe className="w-4 h-4" /> {lang === "tr" ? "EN" : "TR"}
            </button>
            <button
              onClick={() => scrollTo("kayit")}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-[0_0_15px_rgba(0,212,255,0.3)]"
            >
              {t.registerBtn}
            </button>
          </nav>
          <button className="lg:hidden text-slate-300" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        <AnimatePresence>
          {menuOpen ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden bg-[#0a0f1c] border-b border-[#1e293b] overflow-hidden"
            >
              <div className="px-4 py-4 flex flex-col gap-4">
                {t.navItems.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => scrollTo(item.href)}
                    className="text-left text-base font-medium text-slate-300 hover:text-cyan-400 py-2 border-b border-slate-800/50"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={changeLanguage}
                    className="flex items-center gap-2 text-sm font-medium text-slate-400"
                  >
                    <Globe className="w-4 h-4" /> {lang === "tr" ? "English" : "Türkçe"}
                  </button>
                  <button
                    onClick={() => scrollTo("kayit")}
                    className="bg-cyan-600 text-white px-5 py-2 rounded-full text-sm font-bold"
                  >
                    {t.registerBtn}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>

      <section id="hero" className="pt-32 pb-20 md:pt-48 md:pb-32 px-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-900/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="container mx-auto max-w-6xl relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-6">
              <Sparkles className="w-4 h-4" /> {u.onlineTraining}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">{t.heroTitle}</h1>
            <p className="text-lg md:text-xl text-slate-400 mb-8 leading-relaxed max-w-lg">{t.heroSub}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => scrollTo("kayit")}
                className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-full px-8 py-4 font-bold text-white text-lg shadow-[0_0_20px_rgba(0,212,255,0.4)] hover:shadow-[0_0_30px_rgba(0,212,255,0.6)] hover:scale-105 transition-all"
              >
                {t.registerBtn}
              </button>
              <button
                onClick={() => scrollTo("egitim-icerik")}
                className="px-8 py-4 rounded-full font-bold text-white border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800 transition-colors"
              >
                {t.exploreBtn}
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-3xl blur opacity-20 animate-pulse" />
            <div className="relative bg-[#0f172a] border border-[#1e293b] rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="text-xs font-mono text-slate-500">{u.projectAssistant}</div>
              </div>
              <div className="space-y-4">
                <div className="bg-[#0a0f1c] p-4 rounded-xl border border-slate-800">
                  <h3 className="text-cyan-400 font-bold mb-1">{u.projectAssistant}</h3>
                  <p className="text-xs text-slate-400">{u.projectProcessDescription}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {localizedAssistantModules.slice(0, 6).map((mod) => {
                    const Icon = moduleIcons[mod.icon];
                    return (
                      <button
                        key={mod.id}
                        onClick={() => {
                          scrollTo("proje-asistani");
                          setTab("assistant");
                        }}
                        className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center gap-3 text-left hover:border-cyan-500/50 transition-colors"
                      >
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${mod.color} flex items-center justify-center shrink-0`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xs font-medium text-slate-300">{mod.title}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <div className="flex justify-between text-xs text-slate-400 mb-2">
                    <span>{u.generalProgress}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="kimler" className="py-24 bg-[#0a0f1c]">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">{t.targetAudienceTitle}</h2>
            <div className="w-20 h-1 bg-cyan-500 mx-auto rounded-full" />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {localizedAudience.map((item) => (
              <div
                key={item}
                className="flex items-center gap-4 bg-[#0f172a] p-4 rounded-2xl border border-slate-800 hover:border-cyan-500/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-cyan-900/30 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="font-medium text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="egitim-icerik" className="py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">{t.modulesTitle}</h2>
            <div className="w-20 h-1 bg-purple-500 mx-auto rounded-full" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {localizedTrainingModules.map((item, index) => (
              <div
                key={item.title}
                className="bg-[#0f172a] border border-[#1e293b] rounded-3xl p-6 hover:-translate-y-2 transition-transform duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-900/30 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                  <span className="text-xl font-black text-purple-400">{index + 1}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="proje-asistani" className="py-24 bg-[#0A192F] relative border-y border-slate-800/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-900/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-900/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500">
              {u.projectAssistant}
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              {u.projectProcessDescription}
            </p>
          </div>

          <div className="bg-[#0f172a]/60 backdrop-blur-md border border-slate-700/50 rounded-3xl p-4 md:p-8">
            <div className="flex flex-wrap gap-2 mb-8">
              <button
                onClick={() => setTab("assistant")}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  tab === "assistant"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    : "text-slate-400 hover:bg-slate-800"
                }`}
              >
                {u.assistantTab}
              </button>
              <button
                onClick={() => setTab("favorites")}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  tab === "favorites"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "text-slate-400 hover:bg-slate-800"
                }`}
              >
                {u.favoritesTab}
              </button>
              <button
                onClick={() => setTab("projects")}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  tab === "projects"
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    : "text-slate-400 hover:bg-slate-800"
                }`}
              >
                {u.projectsTab}
              </button>
            </div>

            {tab === "assistant" ? (
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-[rgba(255,255,255,0.04)] backdrop-blur p-6 rounded-2xl border border-slate-700/50">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <p className="text-sm text-slate-400 font-medium mb-1">{u.completionRate}</p>
                        <p className="text-xs text-cyan-400">{done.size}/10 {u.modulesCompleted}</p>
                      </div>
                      <span className="text-4xl font-bold text-white">{progress}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-cyan-400 to-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {localizedAssistantModules.map((mod) => {
                      const Icon = moduleIcons[mod.icon];
                      return (
                        <div
                          key={mod.id}
                          className="bg-[rgba(255,255,255,0.04)] border border-slate-700/50 p-5 rounded-2xl flex flex-col hover:border-cyan-500/30 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${mod.color} flex items-center justify-center shrink-0`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            {done.has(mod.id) ? (
                              <span className="text-[10px] font-bold px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                                {u.completed}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                {u.waiting}
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-white text-base mb-1">{mod.title}</h4>
                          <p className="text-xs text-slate-400 mb-4 flex-1">{mod.shortDesc}</p>
                          <div className="flex flex-col gap-2 mt-auto">
                            <button
                              onClick={() => setOpenModule(mod.id)}
                              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors border border-slate-700"
                            >
                              {u.open}
                            </button>
                            <button
                              onClick={() => setReviewId(mod.id)}
                              disabled={mod.id === 9}
                              className={`w-full py-1.5 text-[10px] font-bold rounded-lg transition-colors border ${
                                mod.id === 9
                                  ? "opacity-50 cursor-not-allowed border-slate-800 bg-slate-800/50 text-slate-500"
                                  : "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 text-purple-300"
                              }`}
                            >
                              {u.reviewerEvaluation}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="bg-[rgba(255,255,255,0.04)] backdrop-blur p-6 rounded-2xl border border-slate-700/50">
                    <h3 className="text-lg font-bold text-white mb-6">{u.readinessScore}</h3>
                    <div className="flex justify-center mb-8">
                      <div className="relative w-32 h-32 flex items-center justify-center bg-slate-900 rounded-full border-4 border-slate-800">
                        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                          <circle cx="64" cy="64" r="60" fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-800" />
                          <motion.circle
                            cx="64"
                            cy="64"
                            r="60"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeDasharray="377"
                            strokeDashoffset={377 - (377 * score) / 100}
                            className="text-cyan-400 transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="text-center">
                          <span className="text-3xl font-black text-white">{score}</span>
                          <span className="text-sm text-slate-500 block">/ 100</span>
                        </div>
                      </div>
                    </div>
                    {[
                      [u.originality, original, 25, "bg-rose-500"],
                      [u.method, method, 20, "bg-emerald-500"],
                      [u.objective, aim, 20, "bg-purple-500"],
                      [u.feasibility, apply, 35, "bg-cyan-500"],
                    ].map(([label, value, max, bar]) => (
                      <div key={label} className="mb-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">{label}</span>
                          <span className="font-bold text-white">
                            {value}/{max}
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full">
                          <motion.div
                            className={`h-full ${bar} rounded-full`}
                            initial={{ width: 0 }}
                            animate={{ width: `${(value / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-[rgba(255,255,255,0.04)] backdrop-blur p-6 rounded-2xl border border-slate-700/50">
                    <h3 className="text-lg font-bold text-white mb-4">{u.createProjectFile}</h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => exportProjectReport("word")}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
                      >
                        <FileText className="w-4 h-4" /> {u.downloadWord}
                      </button>
                      <button
                        onClick={() => exportProjectReport("pdf")}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl transition-colors"
                      >
                        <FileText className="w-4 h-4" /> {u.downloadPdf}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {tab === "favorites" ? (
              favorites.length === 0 ? (
                <div className="text-center py-20 bg-[rgba(255,255,255,0.02)] rounded-2xl border border-slate-800 border-dashed">
                  <Star className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">{u.noFavorites}</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favorites.map((item) => {
                    const content = getFavoriteContent(item);
                    return <div
                      key={item.id}
                      className="bg-[rgba(255,255,255,0.04)] border border-slate-700/50 p-5 rounded-2xl flex flex-col relative group"
                    >
                      <button
                        onClick={() => {
                          setFavorites((prev) => prev.filter((fav) => fav.id !== item.id));
                          notify(u.promptRemoved, "info");
                        }}
                        className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-red-400 bg-slate-800 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <h4 className="font-bold text-cyan-300 text-sm mb-3 pr-8">{content.title}</h4>
                      <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 mb-4 flex-1">
                        <p className="text-xs text-slate-300 font-mono leading-relaxed line-clamp-4">{content.text}</p>
                      </div>
                      <button
                        onClick={() => copyText(content.text)}
                        className="flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
                      >
                        <Copy className="w-3.5 h-3.5" /> {u.copy}
                      </button>
                    </div>;
                  })}
                </div>
              )
            ) : null}

            {tab === "projects" ? (
              <div>
                <div className="flex flex-wrap gap-2 mb-6">
                  {categories.map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setFilter(cat.key)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                        filter === cat.key
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                          : "bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {localizedSuccessfulProjects
                    .filter((item) => filter === "all" || item.category === categoryLabel(filter))
                    .map((item) => (
                      <div
                        key={item.title}
                        className="bg-[rgba(255,255,255,0.04)] border border-slate-700/50 p-6 rounded-2xl flex flex-col hover:border-cyan-500/30 transition-colors"
                      >
                        <div className="inline-block px-2 py-1 bg-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-widest rounded mb-3 self-start">
                          {item.category}
                        </div>
                        <h4 className="font-bold text-white text-base mb-3 leading-tight">{item.title}</h4>
                        <p className="text-sm text-slate-400 mb-4 flex-1">&quot;{item.desc}&quot;</p>
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg mb-4">
                          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                          <span className="text-xs text-green-300 font-medium">{item.strength}</span>
                        </div>
                        <button
                          onClick={() => notify(u.ideaGenerating, "info")}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 text-cyan-300 text-xs font-bold rounded-xl transition-all border border-cyan-500/30"
                        >
                          <Sparkles className="w-4 h-4" /> {u.generateSimilarIdea}
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section id="program-akisi" className="py-24 bg-[#0a0f1c]">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">{t.timelineTitle}</h2>
            <div className="w-20 h-1 bg-cyan-500 mx-auto rounded-full" />
          </div>
          <div className="space-y-6">
            {localizedTimeline.map((item, index) => (
              <div key={item} className="flex gap-6 group">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-cyan-900/40 border border-cyan-500/40 flex items-center justify-center font-black text-cyan-300">
                    {index + 1}
                  </div>
                  {index < localizedTimeline.length - 1 ? <div className="w-px flex-1 bg-slate-800 mt-2" /> : null}
                </div>
                <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 flex-1 hover:border-cyan-500/30 transition-colors">
                  <p className="font-semibold text-white">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="kazanimlar" className="py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">{t.outcomesTitle}</h2>
            <div className="w-20 h-1 bg-purple-500 mx-auto rounded-full" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {localizedOutcomes.map((item) => (
              <div key={item} className="flex gap-4 bg-[#0f172a] border border-slate-800 rounded-2xl p-5">
                <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
                <p className="text-slate-300">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="kayit" className="py-24 bg-[#050810] border-t border-slate-800/50">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">{t.registerTitle}</h2>
            <p className="text-slate-400">{u.registrationIntro}</p>
          </div>
          <form onSubmit={register} className="bg-[#0f172a] border border-[#1e293b] p-6 md:p-10 rounded-3xl shadow-xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                ["name", u.fullName, "text"],
                ["email", u.email, "email"],
                ["phone", u.phone, "tel"],
                ["institution", u.institution, "text"],
              ].map(([key, label, type]) => (
                <div key={key} className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">{label}</label>
                  <input
                    required
                    type={type}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full bg-[#0a0a0a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">{u.participantType}</label>
              <select
                required
                value={form.participantType}
                onChange={(e) => setForm({ ...form, participantType: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all appearance-none"
              >
                <option value="">{u.choose}</option>
                <option value="academic">{u.academic}</option>
                <option value="student">{u.student}</option>
                <option value="research-assistant">{u.researchAssistant}</option>
                <option value="other">{u.other}</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">{u.optionalMessage}</label>
              <textarea
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="kvkk"
                checked={kvkk}
                onChange={(e) => setKvkk(e.target.checked)}
                className="w-5 h-5 rounded border-slate-700 bg-[#0a0a0a] text-cyan-500"
              />
              <label htmlFor="kvkk" className="text-sm text-slate-400 cursor-pointer">
                {u.privacyConsent}
              </label>
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-400 via-blue-600 to-purple-600 rounded-xl px-8 py-4 font-bold text-white text-lg shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] transition-all"
            >
              {t.registerTitle}
            </button>
          </form>
        </div>
      </section>

      <section id="iletisim" className="py-24 relative">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-3xl md:text-5xl font-bold mb-8">{t.contactTitle}</h2>
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-3xl p-8 mb-10">
            <div className="space-y-4 text-lg text-slate-300">
              <p>
                <strong className="text-white">{u.emailLabel}</strong> bilgesakrakk@gmail.com
              </p>
              <p>
                <strong className="text-white">{u.phoneLabel}</strong>{" "}
                <a href="tel:+905345965202" className="hover:text-cyan-400 transition-colors">
                  0534 596 52 02
                </a>
              </p>
              <p>
                <strong className="text-white">{u.formatLabel}</strong> {u.onlineHybrid}
              </p>
              <p>
                <strong className="text-white">{u.targetLabel}</strong> TÜBİTAK 2209-A / 2209-B
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href={
                lang === "tr"
                  ? "https://wa.me/905550000000?text=Merhaba,%20Yapay%20Zeka%20Destekli%20TÜBİTAK%202209%20Eğitimi%20hakkında%20bilgi%20almak%20istiyorum."
                  : "https://wa.me/905550000000?text=Hello,%20I%20would%20like%20to%20learn%20more%20about%20the%20AI-powered%20TÜBİTAK%202209%20training."
              }
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-white bg-green-600 hover:bg-green-500 transition-colors shadow-lg"
            >
              <MessageCircle className="w-5 h-5" /> {u.whatsapp}
            </a>
            <button
              onClick={() => scrollTo("kayit")}
              className="px-8 py-4 rounded-full font-bold text-white border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800 transition-colors"
            >
              {u.goToRegistration}
            </button>
          </div>
        </div>
      </section>

      <footer className="bg-[#050810] border-t border-[#1e293b] py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 font-bold text-xl tracking-tight mb-2">
              <GraduationCap className="w-6 h-6 text-cyan-400" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500">
                AI 2209 Akademi
              </span>
            </div>
            <p className="text-sm text-slate-500">{u.footerMotto}</p>
          </div>
          <div className="flex gap-4">
            <button className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-400/50 transition-colors">
              <Instagram className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-500/50 transition-colors">
              <Linkedin className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-purple-500 hover:border-purple-500/50 transition-colors">
              <Youtube className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="text-center text-sm text-slate-600 mt-8">© 2026 AI 2209 Akademi. {u.allRightsReserved}</div>
      </footer>

      <AnimatePresence>
        {showBackToTop ? (
          <motion.button
            type="button"
            aria-label={u.backToTop}
            title={u.scrollUp}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-5 left-5 z-50 w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg flex items-center justify-center"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        ) : null}
      </AnimatePresence>

      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
        <AnimatePresence>
          {chatOpen ? (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="mb-4 w-[calc(100vw-40px)] md:w-[400px] bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              style={{ height: 500, maxHeight: "70vh" }}
            >
              <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 p-4 border-b border-[#1e293b] flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-cyan-400" />
                  <span className="font-semibold text-white">{u.chatCoach}</span>
                </div>
                <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0a0a]/50">
                <div className="mb-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    {u.promptSuggestions}
                  </h4>
                  <div className="flex overflow-x-auto gap-3 pb-4 snap-x">
                    {localizedReviewPrompts.map((item) => (
                      <div
                        key={item.title}
                        className="snap-start shrink-0 w-[200px] bg-slate-900 border border-slate-700 rounded-xl p-3 flex flex-col"
                      >
                        <h5 className="font-bold text-cyan-300 text-xs mb-1">{item.title}</h5>
                        <p className="text-[10px] text-slate-400 mb-3 flex-1">{item.desc}</p>
                        <button
                          onClick={() => copyText(item.prompt)}
                          className="flex items-center gap-1 px-2 py-1 bg-cyan-500/20 text-cyan-300 text-[10px] rounded-md self-end"
                        >
                          <Copy className="w-3 h-3" /> {u.copy}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {localizedCoachQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendChat(null, q)}
                      className="text-[11px] px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:border-cyan-500/40"
                    >
                      {q}
                    </button>
                  ))}
                </div>
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                        msg.sender === "user"
                          ? "bg-cyan-600 text-white"
                          : "bg-slate-800 text-slate-200 border border-slate-700"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatLoading ? (
                  <div className="text-xs text-slate-400" role="status">
                    {u.evaluated}
                  </div>
                ) : null}
                <div ref={chatEnd} />
              </div>
              <form onSubmit={sendChat} className="p-3 border-t border-slate-800 flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={chatLoading}
                  placeholder={u.chatPlaceholder}
                  className="flex-1 bg-[#0a0a0a] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  aria-label={u.sendMessage}
                  className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 rounded-xl px-3 text-white"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(0,212,255,0.4)] flex items-center justify-center"
        >
          {chatOpen ? <X className="w-6 h-6" /> : <GraduationCap className="w-7 h-7" />}
        </button>
      </div>

      <AnimatePresence>
        {activeModule ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            ref={moduleDialogRef}
            className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={() => setOpenModule(null)}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-3xl mx-auto my-10 bg-[#0f172a] border border-slate-700 rounded-3xl p-6 md:p-8"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white">{activeModule.title}</h3>
                  <p className="text-slate-400 text-sm mt-1">{activeModule.shortDesc}</p>
                </div>
                <button onClick={() => setOpenModule(null)} className="text-slate-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {activeModule.id === 9 ? (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    {allChecked ? (
                      <span className="text-green-400 font-bold">{u.readyProject}</span>
                    ) : (
                      <>
                        <CheckCircle2 className="text-cyan-400" />
                        <span className="font-semibold">{u.finalChecklist}</span>
                      </>
                    )}
                  </div>
                  <div className="space-y-3">
                    {localizedChecklistItems.map((item, index) => (
                      <label key={item} className="flex items-center gap-3 cursor-pointer group">
                        <div
                          className={`w-6 h-6 rounded flex items-center justify-center border transition-colors ${
                            checks[index]
                              ? "bg-green-500 border-green-500"
                              : "bg-[#0a0a0a] border-slate-700 group-hover:border-cyan-500"
                          }`}
                        >
                          {checks[index] ? <Check className="w-4 h-4 text-white" /> : null}
                        </div>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={!!checks[index]}
                          onChange={(e) => setChecks((prev) => ({ ...prev, [index]: e.target.checked }))}
                        />
                        <span className={`text-sm ${checks[index] ? "text-slate-400 line-through" : "text-slate-200"}`}>
                          {item}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm font-semibold text-cyan-300">{u.projectDetails}</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                      {u.projectDetailsHelp}
                    </p>
                    <div className="space-y-3">
                      {[
                        ["topic", u.projectTopic, u.topicExample],
                        ["problem", u.problemStatement, u.problemExample],
                        ["audience", u.targetAudience, u.audienceExample],
                      ].map(([key, label, placeholder]) => (
                        <div key={key}>
                          <label className="text-xs text-slate-400 mb-1 block">{label}</label>
                          <input
                            value={info[key]}
                            onChange={(e) => setInfo((current) => ({ ...current, [key]: e.target.value }))}
                            placeholder={placeholder}
                            className="w-full bg-[#0a0a0a] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-500 transition-colors"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">{u.myNotes}</h3>
                    <textarea
                      value={notes[activeModule.id] || ""}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [activeModule.id]: e.target.value }))}
                      placeholder={u.notesPlaceholder}
                      rows={6}
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 px-4 py-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl mb-3">
                    <Copy className="w-4 h-4 text-cyan-400 shrink-0" />
                    <p className="text-xs text-cyan-300/80">
                      {u.promptHelp}
                    </p>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">{u.promptLibrary}</h3>
                  <div className="space-y-3">
                    {activeModule.prompts.map((prompt, promptIndex) => {
                      const filled = fillPrompt(prompt.template, info, lang);
                      const fav = favorites.some(
                        (item) =>
                          item.moduleId === activeModule.id &&
                          item.promptIndex === promptIndex
                      );
                      return (
                        <div
                          key={prompt.title}
                          className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden hover:border-cyan-500/30 transition-colors p-4"
                        >
                          <div className="flex justify-between gap-3 mb-2">
                            <div>
                              <h4 className="font-bold text-white text-sm">{prompt.title}</h4>
                              <p className="text-xs text-slate-400">{prompt.desc}</p>
                            </div>
                            <button                             onClick={() =>
                              toggleFavorite({
                                ...prompt,
                                moduleId: activeModule.id,
                                promptIndex,
                              })
                            } className={fav ? "text-yellow-400" : "text-slate-500"}>
                              <Star className={`w-4 h-4 ${fav ? "fill-yellow-400" : ""}`} />
                            </button>
                          </div>
                          <pre className="text-xs text-slate-300 bg-[#0a0a0a] border border-slate-800 rounded-lg p-3 whitespace-pre-wrap font-mono mb-3">
                            {filled}
                          </pre>
                          <button
                            onClick={() => copyText(filled)}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700"
                          >
                            <Copy className="w-3.5 h-3.5" /> {u.copy}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              <button
                onClick={() => {
                  const wasDone = done.has(activeModule.id);
                  toggleDone(activeModule.id);
                  if (!wasDone) {
                    const nextModule = localizedAssistantModules.find(
                      (module) => module.id > activeModule.id && !done.has(module.id)
                    );
                    setOpenModule(nextModule?.id ?? null);
                  }
                }}
                className={`mt-6 w-full py-3 rounded-xl font-bold ${
                  done.has(activeModule.id)
                    ? "bg-green-600 text-white"
                    : "bg-slate-800 text-slate-200 border border-slate-700"
                }`}
              >
                {done.has(activeModule.id) ? u.completed : u.markCompleted}
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {reviewId !== null && reviewId !== 9 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={() => setReviewId(null)}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-3xl mx-auto my-10 bg-[#0f172a] border border-slate-700 rounded-3xl p-6 md:p-8"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white">{u.reviewerTitle}</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    {localizedAssistantModules.find((m) => m.id === reviewId)?.title}
                  </p>
                </div>
                <button onClick={() => setReviewId(null)} className="text-slate-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="text-center mb-6">
                <p className="text-5xl font-black text-white">{reviewTotal}</p>
                <p className="text-slate-400">/ 100</p>
                <p className="mt-2 font-semibold">
                  {reviewTotal >= 80
                    ? u.highSupportable
                    : reviewTotal >= 65
                    ? u.mediumRevision
                    : u.lowDevelopment}
                </p>
              </div>
              <h3 className="font-bold text-white text-lg mb-4">{u.criteriaAnalysis}</h3>
              <div className="space-y-4 mb-6">
                {localizedReviewCriteria.map((item) => (
                  <div key={item.name} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-slate-200">{item.name}</span>
                      <span className="text-sm font-bold text-cyan-400">
                        {item.score}/{item.max}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden mb-3">
                      <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${(item.score / item.max) * 100}%` }} />
                    </div>
                    <p className="text-xs text-slate-400 mb-1">
                      <strong className="text-slate-300">{u.comment}</strong> {item.yorum}
                    </p>
                    <p className="text-xs text-yellow-400/80">
                      <strong className="text-yellow-400">{u.suggestion}</strong> {item.oneri}
                    </p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
                  <h4 className="font-bold text-green-400 text-sm mb-3">{u.strengths}</h4>
                  <ul className="text-xs text-green-300/80 space-y-2">
                    {[u.problemCurrent, u.audienceClear, u.methodFeasible, u.studentLevel].map(
                      (item) => (
                        <li key={item} className="flex gap-2">
                          <Check className="w-3.5 h-3.5 shrink-0" /> {item}
                        </li>
                      )
                    )}
                  </ul>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                  <h4 className="font-bold text-red-400 text-sm mb-3">{u.improvements}</h4>
                  <ul className="text-xs text-red-300/80 space-y-2">
                    {[
                      u.originalityConcrete,
                      u.hypothesisMeasurable,
                      u.literatureGap,
                      u.impactClear,
                    ].map((item) => (
                      <li key={item} className="flex gap-2">
                        <X className="w-3.5 h-3.5 shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
