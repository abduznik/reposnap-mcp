# Getting Started

Welcome to **reposnap-mcp**!

reposnap-mcp is a free, open-source Model Context Protocol (MCP) server that allows AI assistants like Claude Desktop, Cursor, and Windsurf to automatically load and analyze public GitHub repositories. Simply provide a GitHub repository URL, and your AI assistant can fetch the repository to help with code reviews, architecture analysis, debugging, documentation, refactoring, and more.

## Installation

Use the hosted MCP endpoint:

```text
https://reposnap-mcp.bacholate.workers.dev/mcp
```

Add the following configuration to your MCP client:

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

Place it in the appropriate configuration file for your client:

| Client | Configuration File |
| ------- | ------------------ |
| Claude Desktop | `claude_desktop_config.json` |
| Cursor | `.cursor/mcp.json` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` |

Restart your AI client after saving the configuration.

## Example

Ask your AI assistant:

> Analyze the architecture of https://github.com/username/repository

The AI will automatically ingest the repository and use its contents to answer your questions.

## FAQ

### Is it free?

Yes. reposnap-mcp is open source under the MIT License, and the hosted endpoint is free to use.

### How much does it cost?

The hosted endpoint is free. If you choose to self-host, you'll only be responsible for your own hosting infrastructure.

### Is my data stored?

The hosted endpoint fetches repository contents only when requested. For full control over your data or access to private repositories, you can self-host reposnap-mcp with your own GitHub Personal Access Token.

## Learn More

For self-hosting, API details, advanced configuration, and additional documentation, see the [README](../README.md).