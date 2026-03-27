# Tattty 4 All — MCP App Server

An MCP App server exposing the `tattzy25/tattty_4_all` tattoo-generation LoRA model with an interactive UI that renders directly inside Claude, ChatGPT, VS Code, Goose, and any other MCP Apps-capable client.

---

## What this does

When a client connects and calls `generate_tattoo`, the host renders a full interactive UI in the conversation:

- **Prompt input** with `TA-TTT-OO-ME` trigger word pre-filled
- **Aspect ratio selector** (1:1, 9:16, 16:9, 4:3, 3:4)
- **Gallery** of all past generations in the session
- Click any gallery image to re-use its prompt

---

## Local development

```bash
# 1. Install dependencies
npm install

# 2. Set your Replicate API token
export REPLICATE_API_TOKEN=r8_your_token_here

# 3. Run dev mode (watches for changes)
npm start

# Server runs at http://localhost:3001/mcp
```

---

## Deploy to Railway

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
3. Select your repo — Railway auto-detects the Dockerfile
4. Add environment variable:
   - `REPLICATE_API_TOKEN` = `r8_your_token_here`
5. Deploy — Railway gives you a public URL like `https://tattty-mcp-production.up.railway.app`

Your MCP endpoint will be: `https://your-railway-domain.up.railway.app/mcp`

---

## Deploy to Render

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New** → **Web Service**
3. Connect your repo
4. Settings:
   - **Environment**: Docker
   - **Build Command**: *(auto from Dockerfile)*
   - **Start Command**: *(auto from Dockerfile)*
5. Add environment variable:
   - `REPLICATE_API_TOKEN` = `r8_your_token_here`
6. Deploy — Render gives you `https://tattty-mcp.onrender.com`

Your MCP endpoint will be: `https://tattty-mcp.onrender.com/mcp`

---

## Connect clients

### Claude.ai
1. Go to **Settings → Integrations → Add MCP Server**
2. Enter your URL: `https://your-domain/mcp`
3. No auth required — it's open!
4. Ask Claude: *"Generate a tattoo for me"*

### Claude Desktop / claude_desktop_config.json
```json
{
  "mcpServers": {
    "tattty": {
      "url": "https://your-domain/mcp"
    }
  }
}
```

### VS Code / Goose / ChatGPT
All support MCP Apps — add `https://your-domain/mcp` as an MCP server URL in their respective settings.

---

## Model info

- **Model**: `tattzy25/tattty_4_all`
- **Version**: `4e8f6c1dc77db77dabaf98318cde3679375a399b434ae2db0e698804ac84919c`
- **Trigger word**: `TA-TTT-OO-ME` (auto-prepended — users don't need to type it)
- **Training**: 678 sketch designs, blackwork / urban / Chicano styles

---

## Project structure

```
tattty-mcp/
├── main.ts          # Server entry point (HTTP + stdio)
├── server.ts        # MCP tool + resource registration
├── mcp-app.html     # UI shell (Vite bundles this)
├── src/
│   └── mcp-app.ts   # Client-side App script
├── Dockerfile       # For Railway / Render
├── vite.config.ts   # Bundles UI into single HTML file
├── tsconfig.json
└── tsconfig.server.json
```
