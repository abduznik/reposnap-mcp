# API Reference

reposnap-mcp exposes a single MCP-over-HTTP endpoint:

```text
POST /mcp
```

Use it with JSON-RPC 2.0 requests. The hosted endpoint is:

```text
https://reposnap-mcp.bacholate.workers.dev/mcp
```

Self-hosted Node deployments default to:

```text
http://localhost:3000/mcp
```

## Headers

```text
Content-Type: application/json
```

The server also supports CORS `OPTIONS` preflight requests.

## Tool call

Call the `ingest_repo` tool with a public GitHub repository URL:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "ingest_repo",
    "arguments": {
      "repo_url": "https://github.com/user/repo"
    }
  }
}
```

Example with `curl`:

```bash
curl -sS https://reposnap-mcp.bacholate.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"ingest_repo","arguments":{"repo_url":"https://github.com/abduznik/reposnap-mcp"}}}'
```

Example with JavaScript:

```js
const response = await fetch("https://reposnap-mcp.bacholate.workers.dev/mcp", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "ingest_repo",
      arguments: { repo_url: "https://github.com/abduznik/reposnap-mcp" },
    },
  }),
});

console.log(await response.json());
```

Example with Python:

```python
import requests

payload = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
        "name": "ingest_repo",
        "arguments": {"repo_url": "https://github.com/abduznik/reposnap-mcp"},
    },
}

response = requests.post(
    "https://reposnap-mcp.bacholate.workers.dev/mcp",
    json=payload,
    timeout=30,
)
print(response.json())
```

## Responses

Success responses wrap the repository snapshot in MCP text content:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Repository: user/repo @ main\n\nFile tree:\n..."
      }
    ]
  }
}
```

Error responses use JSON-RPC error objects:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Missing required argument: repo_url"
  }
}
```

Common errors:

- `-32700` - request body is not valid JSON.
- `-32601` - method or tool name is unknown.
- `-32602` - required arguments are missing or invalid.
- `-32603` - repository fetch failed or another internal error occurred.

## Rate limits and tokens

Without a GitHub token, requests use GitHub's unauthenticated limit of 60
requests per hour. To use a token, add it to the endpoint query string:

```text
https://reposnap-mcp.bacholate.workers.dev/mcp?token=YOUR_GITHUB_TOKEN
```

Self-hosted deployments can also set `GITHUB_TOKEN` in the environment. Token
authenticated requests can use GitHub's 5,000 requests per hour limit. Tokens
are used only for GitHub API authentication; they are not stored by reposnap-mcp.

See `README.md` for high-level setup and self-hosting instructions, and
`worker.js` / `server.js` for the Cloudflare Worker and Node implementations.
