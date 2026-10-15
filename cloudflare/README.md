# Cloudflare Workers AI

The browser sends chat requests to the same-origin Vercel function at `/api/chat`.
That function forwards validated messages to this Worker. The Cloudflare AI binding
and the shared secret stay on the server and are never sent to the browser.

## Deploy the Worker

1. Create or sign in to a Cloudflare account and enable Workers AI.
2. From the repository root, authenticate Wrangler:

   ```sh
   npx wrangler login
   ```

3. Generate a strong shared secret locally. Do not commit it or send it in chat:

   ```sh
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

4. Store that exact secret as a Cloudflare Worker secret:

   ```sh
   npx wrangler secret put CHAT_API_SECRET --config cloudflare/wrangler.jsonc
   ```

   Paste the generated value when Wrangler prompts for it.

5. Deploy the Worker:

   ```sh
   npx wrangler deploy --config cloudflare/wrangler.jsonc
   ```

   Wrangler prints a URL similar to
   `https://ai-2209-akademi-chat.<your-account>.workers.dev`.
   The chat endpoint is that URL plus `/chat`.

## Configure Vercel

In the Vercel project settings, add these server-side environment variables for
Production and any Preview environments that should have AI chat:

- `CLOUDFLARE_CHAT_URL`: the deployed Worker URL ending in `/chat`
- `CHAT_API_SECRET`: the same secret stored in the Worker

Redeploy Vercel after adding the variables. Do not prefix these variables with
`VITE_` or expose them in frontend code.

Workers AI has usage limits and may require a paid Workers plan when the free
daily allocation is exceeded. The model is selected in `wrangler.jsonc`.
