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

## Self-hosted

To run reposnap-mcp yourself, clone this repository and follow the deployment instructions in the source code.

## License

MIT

## Built by

[abduznik](https://github.com/abduznik)

Support this project: [Sponsor on GitHub](https://github.com/sponsors/abduznik)
