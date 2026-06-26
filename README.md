# reposnap-mcp

Ingest any GitHub repository directly into your AI context using Model Context Protocol (MCP). Works with Claude, Cursor, Windsurf, and any MCP-compatible AI assistant.

## What is reposnap-mcp?

reposnap-mcp is a free, open-source MCP server that lets you instantly load entire GitHub repositories into your AI's context without manual copy-pasting. Point your AI tool at our endpoint, call the `ingest_repo` tool with a GitHub URL, and get the full file tree and source code injected into your conversation.

## Quick start

Add this to your `claude_desktop_config.json` or MCP client configuration:

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

Then in Claude, Cursor, or any MCP client, use the `ingest_repo` tool with any public GitHub URL:

```
ingest_repo(repo_url="https://github.com/username/repo-name")
```

The tool returns the complete repository structure and source code, ready for analysis, refactoring, documentation, or any AI task.

## How it works

1. **Configure** — Point your MCP client to the reposnap endpoint
2. **Call** — Use `ingest_repo` with a public GitHub URL
3. **Receive** — Get the full file tree and source code in plain text

Perfect for:
- Analyzing unfamiliar codebases
- Getting AI help understanding project structure
- Refactoring or documenting large repos
- Code review and auditing
- Learning from open-source projects

## Tools

### `ingest_repo`

**Input:**
- `repo_url` (string) — A public GitHub repository URL (e.g., `https://github.com/user/repo`)

**Output:**
- Plain text containing the repository's file tree and complete source code

## Self-hosting

Want to run reposnap-mcp yourself? You can use Docker, or run it directly with Node.js.

### With Docker

1. Clone the repository
2. Copy `.env.example` to `.env` and set your GitHub token (optional):
   ```bash
   cp .env.example .env
   # Edit .env and add your GITHUB_TOKEN if needed
   ```
3. Start the server:
   ```bash
   docker compose up -d
   ```

The server runs on `http://localhost:3000`.

### With Node.js (18+)

1. Clone the repository
2. Set environment variables:
   ```bash
   export GITHUB_TOKEN=your_github_token_here  # Optional
   export PORT=3000  # Optional, defaults to 3000
   ```
3. Run the server:
   ```bash
   node server.js
   ```

### Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GITHUB_TOKEN` | No | None | GitHub Personal Access Token for higher rate limits |
| `PORT` | No | 3000 | HTTP server port |

### Rate limits

- **Without GitHub token**: 60 API requests per hour, per IP address
- **With GitHub token**: 5000 API requests per hour

To get a GitHub token, see [Creating a personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic). You only need read access to public repositories.

### MCP configuration for self-hosted

Update your `claude_desktop_config.json` to point at your local server:

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

Then restart your AI assistant and you're ready to use `ingest_repo` with your own rate limits.

## License

MIT

## Built by

[abduznik](https://github.com/abduznik)

Support this project: [Sponsor on GitHub](https://github.com/sponsors/abduznik)
