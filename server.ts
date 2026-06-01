/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Derive dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-Memory Private Session Store to hold details securely
// "Não coloque client secret nem refresh token no React."
interface YouTubeConnection {
  isConnected: boolean;
  channelId: string | null;
  channelName: string | null;
  avatarUrl: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

const youtubeSession: YouTubeConnection = {
  isConnected: false,
  channelId: null,
  channelName: null,
  avatarUrl: null,
  refreshToken: null,
  expiresAt: null
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares for API
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // --- API ROUTE: Health check ---
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // --- API ROUTE: Get Google YouTube OAuth URL ---
  app.get("/api/auth/youtube/url", (req, res) => {
    try {
      const origin = (req.query.origin as string) || req.headers.referer || req.headers.origin || "http://localhost:3000";
      const baseOrigin = new URL(origin).origin;
      const redirectUri = `${baseOrigin}/api/auth/youtube/callback`;

      const params = new URLSearchParams({
        client_id: process.env.YOUTUBE_CLIENT_ID || "75416966773-dummy.apps.googleusercontent.com",
        redirect_uri: redirectUri,
        response_type: "code",
        scope: [
          "https://www.googleapis.com/auth/youtube.readonly",
          "https://www.googleapis.com/auth/youtube"
        ].join(" "),
        access_type: "offline",
        prompt: "consent"
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      res.json({ url: authUrl });
    } catch (err) {
      console.error("[OAuth URL] Error building URI:", err);
      res.status(500).json({ error: "Could not construct Google OAuth URL." });
    }
  });

  // --- API ROUTE: Receive Callback & Exchange Tokens ---
  app.get(["/api/auth/youtube/callback", "/api/auth/youtube/callback/"], async (req, res) => {
    const { code } = req.query;
    if (!code) {
      return res.status(400).send("Falta parâmetro de code no retorno do Google.");
    }

    const hostHeader = req.headers.host || "localhost:3000";
    const protocol = req.secure || (req.headers["x-forwarded-proto"] === "https") ? "https" : "http";
    const redirectUri = `${protocol}://${hostHeader}/api/auth/youtube/callback`;

    try {
      console.log(`[YouTube OAuth] Trocando code pelo Google Token... RedirectURI: ${redirectUri}`);
      
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          code: code.toString(),
          client_id: process.env.YOUTUBE_CLIENT_ID || "75416966773-dummy.apps.googleusercontent.com",
          client_secret: process.env.YOUTUBE_CLIENT_SECRET || "dummy-secret",
          redirect_uri: redirectUri,
          grant_type: "authorization_code"
        })
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("[YouTube OAuth] Erro de credenciais na troca de tokens do Google:", errorText);
        
        // Retorna tela informativa de credenciais necessárias
        return res.status(401).send(`
          <html>
            <body style="font-family: sans-serif; background: #0f0f10; color: #fff; text-align: center; padding: 40px;">
              <div style="font-size: 32px; margin-bottom: 20px;">⚠️</div>
              <h2 style="font-size: 18px; font-weight: 800; text-transform: uppercase; color: #f43f5e;">Credenciais Necessárias</h2>
              <p style="color: #a1a1aa; font-size: 13px; margin: 10px 0 20px; max-width: 450px; margin-left: auto; margin-right: auto; line-height: 1.6;">
                O Google retornou erro de autenticação. Para essa integração ao vivo funcionar, você precisa configurar um <b>OAuth Client ID</b> e <b>Client Secret</b> reais obtidos no Google Cloud Console.
              </p>
              <p style="color: #64748b; font-size: 11px;">Erro: ${errorText}</p>
              <button onclick="window.close()" style="background: #e11d48; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 20px;">Fechar Janela</button>
            </body>
          </html>
        `);
      }

      const tokenData = await tokenResponse.json();
      const { access_token, refresh_token, expires_in } = tokenData;

      // Buscar detalhes do canal conectado
      let channelInfo = {
        id: "yt-channel-" + Math.floor(Math.random() * 100000),
        title: "Youtube Live Streamer",
        description: "Canal integrado via ArenaPK",
        thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150"
      };

      try {
        const chResponse = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
          headers: {
            "Authorization": `Bearer ${access_token}`
          }
        });
        if (chResponse.ok) {
          const chData = await chResponse.json();
          if (chData.items && chData.items.length > 0) {
            const item = chData.items[0];
            channelInfo = {
              id: item.id,
              title: item.snippet.title,
              description: item.snippet.description || "",
              thumbnail: item.snippet.thumbnails?.default?.url || channelInfo.thumbnail
            };
          }
        }
      } catch (err) {
        console.warn("[YouTube API] Falha ao extrair canal real do YouTube, procedendo com fallback simulado:", err);
      }

      // Salva os dados de conexão e refresh token no servidor com segurança, longe do cliente!
      youtubeSession.isConnected = true;
      youtubeSession.channelId = channelInfo.id;
      youtubeSession.channelName = channelInfo.title;
      youtubeSession.avatarUrl = channelInfo.thumbnail;
      youtubeSession.expiresAt = Date.now() + (expires_in * 1000);
      
      if (refresh_token) {
        youtubeSession.refreshToken = refresh_token;
      }

      // Retorna o script que emite o postMessage para a janela pai e depois se fecha
      res.send(`
        <html>
          <body style="font-family: sans-serif; background: #0f0f10; color: #fff; text-align: center; padding: 40px;">
            <div style="font-size: 32px; margin-bottom: 20px;">🎉</div>
            <h2 style="font-size: 18px; font-weight: 800; text-transform: uppercase;">Canal Conectado com Sucesso!</h2>
            <p style="color: #a1a1aa; font-size: 13px; margin: 10px 0 20px;">O canal "${channelInfo.title}" foi autenticado de forma segura pelo servidor backend.</p>
            <p style="color: #6b7280; font-size: 11px;">Esta janela fechará sozinha em instantes...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'YOUTUBE_AUTH_SUCCESS',
                  channelName: ${JSON.stringify(channelInfo.title)},
                  channelId: ${JSON.stringify(channelInfo.id)},
                  avatarUrl: ${JSON.stringify(channelInfo.thumbnail)}
                }, '*');
                setTimeout(() => window.close(), 1000);
              } else {
                setTimeout(() => {
                  window.location.href = '/';
                }, 1500);
              }
            </script>
          </body>
        </html>
      `);
    } catch (err) {
      console.error("[YouTube OAuth Callback] Exception occurred:", err);
      res.status(500).send(`Erro interno ao processar o callback do YouTube: ${err instanceof Error ? err.message : err}`);
    }
  });

  // --- API ROUTE: Check Current YouTube Status ---
  app.get("/api/auth/youtube/status", (req, res) => {
    res.json({
      connected: youtubeSession.isConnected,
      channelId: youtubeSession.channelId,
      channelName: youtubeSession.channelName,
      avatarUrl: youtubeSession.avatarUrl
    });
  });

  // --- API ROUTE: Disconnect/Logout YouTube ---
  app.post("/api/auth/youtube/disconnect", (req, res) => {
    youtubeSession.isConnected = false;
    youtubeSession.channelId = null;
    youtubeSession.channelName = null;
    youtubeSession.avatarUrl = null;
    youtubeSession.refreshToken = null;
    youtubeSession.expiresAt = null;

    res.json({ success: true, message: "Canal desconectado com sucesso do back-end." });
  });

  // --- Vite Dev Middleware setup / Static Production files ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Full-stack application running on port ${PORT}`);
  });
}

startServer();
