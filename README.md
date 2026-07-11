&lt;!-- GitHub Topics to add manually: mcp, model-context-protocol, github, claude, cursor, windsurf, ai-tools, llm, developer-tools --&gt;

# reposnap-mcp — Load Any GitHub Repo into Claude (or Cursor, Windsurf)

A free, open-source **MCP server for GitHub** that lets you load any GitHub repository into Claude, Cursor, Windsurf, or any MCP-compatible AI assistant in seconds. The perfect tool to ingest a codebase into AI context without copy-pasting a single file.

> If you've ever wanted to analyze any GitHub repo with Claude mid-conversation — this is the MCP server for that.

---

## Quick Start (30 seconds)

Add this to your `claude_desktop_config.json` (on macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "reposnap": {
      "type": "url",
      "url": "https://reposnap-mcp.bacholate.workers.dev/mcp"
    }
  }
}
```

Restart Claude Desktop, then say:

```
Analyze the architecture of https://github.com/username/repo
```

Claude calls `ingest_repo` automatically. No copy-paste, no upload, no manual step.

---

## What It Does

Most developers who want to analyze a codebase with Claude end up doing the same tedious thing: finding all the relevant files, copying them, pasting them into the chat window, and hoping it fits in the context window. It's slow, error-prone, and breaks as soon as the repo changes.

**reposnap-mcp is a Model Context Protocol server** that solves this at the AI layer. Once configured, Claude (or Cursor, or Windsurf) can call `ingest_repo(repo_url)` directly during a conversation. The full file tree and source code of any public GitHub repository are injected into context on demand — no user action required after the initial one-time setup.

This is fundamentally different from tools like gitingest: gitingest gives you a text blob you manually paste. reposnap-mcp is MCP-native — the AI invokes it autonomously, mid-conversation, whenever it decides it needs the repo context. You describe the task; the AI fetches what it needs.

reposnap-mcp is a **Model Context Protocol server** built on Cloudflare Workers. It fetches each file via the GitHub API, concatenates them into a structured text blob, and returns the full repo content as plain text — ready for analysis, refactoring, documentation, debugging, or any other AI task.

---

## Use Cases

| Task | What to tell Claude |
|------|---------------------|
| **Code review** | "Review the security of this repo: https://github.com/..." |
| **Architecture analysis** | "Explain the architecture of this project: https://github.com/..." |
| **Onboarding** | "I'm new to this codebase. Give me a tour: https://github.com/..." |
| **Generate docs** | "Write a detailed README for https://github.com/..." |
| **Debugging** | "Find potential bugs in https://github.com/..." |
| **Refactoring** | "Suggest refactors for https://github.com/... focusing on performance" |
| **Test generation** | "Write tests for the main modules in https://github.com/..." |
| **Dependency audit** | "What dependencies does this project have and are any outdated? https://github.com/..." |

---

## Supported Clients

This is a **Model Context Protocol server** compatible with any MCP client. Tested and confirmed working with:

| Client | Config file | Config snippet |
|--------|-------------|----------------|
| **Claude Desktop** | `claude_desktop_config.json` | See Quick Start above |
| **Claude.ai** | Settings → Connectors | Add endpoint URL manually |
| **Cursor** | `.cursor/mcp.json` | Same JSON as Claude Desktop |
| **Windsurf** | `~/.codeium/windsurf/mcp_config.json` | Same JSON as Claude Desktop |
| **VS Code (Copilot agent mode)** | `.vscode/mcp.json` | Same JSON as Claude Desktop |
| **Any MCP client** | Varies | Use endpoint URL directly |

**Endpoint URL:** `https://reposnap-mcp.bacholate.workers.dev/mcp`

**Cursor config** (`.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "reposnap": {
      "type": "url",
      "url": "https://reposnap-mcp.bacholate.workers.dev/mcp"
    }
  }
}
```

**Windsurf config** (`~/.codeium/windsurf/mcp_config.json`):
```json
{
  "mcpServers": {
    "reposnap": {
      "type": "url",
      "url": "https://reposnap-mcp.bacholate.workers.dev/mcp"
    }
  }
}
```

---

## How It Works

1. **Configure once** — Add the endpoint to your MCP client config. Takes under a minute.
2. **AI calls `ingest_repo(repo_url)`** — Triggered automatically by Claude/Cursor/Windsurf when you mention a GitHub repo or ask it to analyze one.
3. **Full file tree + source injected** — The complete repository structure and source code land in your AI's context, ready for any task.

---

## Self-Hosting

Run your own instance to get **5,000 GitHub API requests/hour** instead of the shared 60/hr limit. Self-hosting with your own GitHub Personal Access Token also enables private repository support.

### Why self-host?

- **Higher rate limits**: Your own GitHub token = 5000 req/hr vs. 60/hr on the shared endpoint
- **Private repos**: A PAT with `repo` scope gives access to your private repositories
- **Data control**: Traffic goes through your own infrastructure

### With Docker

```bash
git clone https://github.com/abduznik/reposnap-mcp
cd reposnap-mcp
cp .env.example .env
# Edit .env and add your GITHUB_TOKEN
docker compose up -d
```

Server runs at `http://localhost:3000`.

### With Node.js (18+)

```bash
git clone https://github.com/abduznik/reposnap-mcp
cd reposnap-mcp
export GITHUB_TOKEN=your_github_token_here  # Optional
export PORT=3000                            # Optional, defaults to 3000
node server.js
```

### Running Tests

Run the integration tests using:

```bash
node test.js
```

The integration test suite automatically starts and stops the server and verifies:

- Server startup and shutdown
- Health endpoint (`GET /`)
- MCP initialization
- Tool listing
- Unknown method handling
- Invalid JSON handling
- Unknown route handling

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GITHUB_TOKEN` | No | None | GitHub PAT for higher rate limits (5000/hr) |
| `PORT` | No | 3000 | HTTP server port |

### MCP Config for Self-Hosted

```json
{
  "mcpServers": {
    "reposnap": {
      "type": "url",
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

---

## API Reference

### `ingest_repo`

Fetches and concatenates the source files of a public GitHub repository into a single text blob.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `repo_url` | string | Yes | Public GitHub repository URL (e.g., `https://github.com/user/repo`) |

**Output:** Plain text containing the repository's file tree and complete source code.

**Limits:**
- 100KB per file (larger files skipped)
- 500KB total output cap

**Rate limits (hosted endpoint):**
- Without token: 60 requests/hour (GitHub's unauthenticated limit)
- With token (self-hosted): 5000 requests/hour

To get a GitHub token: [Creating a personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic). No permissions needed for public repos.

---

## FAQ

**How is this different from gitingest?**
gitingest requires you to manually visit a website, generate a text blob, and paste it into your AI chat. reposnap-mcp is called directly by the AI during a conversation — no user intervention needed after initial setup. You say "analyze this repo" and the AI fetches and loads it automatically.

**Does it work with private repos?**
Not on the shared hosted endpoint. If you self-host and configure a GitHub PAT with `repo` scope, it will work with any private repository that token can access.

**What's the file size limit?**
100KB per individual file; 500KB total output cap. Files exceeding the per-file limit are skipped with a note in the output.

**Which AI clients support it?**
Any MCP-compatible client. Tested with Claude Desktop, Claude.ai (via Connectors), Cursor, and Windsurf.

**Is it free?**
Yes. MIT licensed, open source, and the hosted endpoint is free to use.

**Do I need an account?**
No account or auth needed for the hosted endpoint. Subject to GitHub's shared rate limit (60 req/hr) unless you self-host with your own token.

**Does Claude.ai support it?**
Yes — add the endpoint URL as a custom connector in Claude.ai Settings → Connectors.

---

## License + Credits

MIT License — see [LICENSE](LICENSE)

GitHub: [abduznik/reposnap-mcp](https://github.com/abduznik/reposnap-mcp)

Built by [abduznik](https://github.com/abduznik) — [Sponsor on GitHub](https://github.com/sponsors/abduznik)
