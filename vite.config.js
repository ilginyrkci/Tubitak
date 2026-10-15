import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { handleChat } from "./server.js";

function localChatApi() {
  return {
    name: "local-chat-api",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (new URL(request.url || "/", "http://localhost").pathname !== "/api/chat") {
          next();
          return;
        }
        void handleChat(request, response);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), localChatApi()],
  server: {
    port: 5173,
    host: true,
  },
});
