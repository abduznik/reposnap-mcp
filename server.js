import http from "http";

const GITHUB_API = "https://api.github.com";
const MAX_FILE_SIZE = 100 * 1024;
const MAX_TOTAL_SIZE = 500 * 1024;
const PORT = parseInt(process.env.PORT || "3000", 10);
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || null;

const SKIP_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp",
  ".mp4", ".mp3", ".wav", ".zip", ".tar", ".gz", ".wasm",
  ".ttf", ".woff", ".woff2", ".eot", ".pdf", ".bin", ".exe",
]);

const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".next",
  "__pycache__", ".cache", "coverage", ".turbo",
]);

// ── GitHub helpers ──────────────────────────────────────────────────────────

function parseRepoUrl(url) {
  try {
    const u = new URL(url.trim());
    if (u.hostname !== "github.com") return null;
    const parts = u.pathname.replace(/^\//, "").split("/");
    if (parts.length < 2) return null;
    return {
      owner: parts[0],
      repo: parts[1].replace(/\.git$/, ""),
      branch: parts[3] ?? null,
    };
  } catch {
    return null;
  }
}

async function githubFetch(path, token) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "reposnap-mcp/1.0",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${GITHUB_API}${path}`, { headers });
}

async function getDefaultBranch(owner, repo, token) {
  const res = await githubFetch(`/repos/${owner}/${repo}`, token);
  if (!res.ok) throw new Error(`Repo not found: ${owner}/${repo}`);
  const data = await res.json();
  return data.default_branch;
}

async function getTree(owner, repo, branch, token) {
  const res = await githubFetch(
    `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    token
  );
  if (!res.ok)
    throw new Error(
      `Failed to fetch tree for ${owner}/${repo}@${branch}`
    );
  const data = await res.json();
  return data.tree;
}

async function getFileContent(owner, repo, filePath, token) {
  const res = await githubFetch(
    `/repos/${owner}/${repo}/contents/${filePath}`,
    token
  );
  if (!res.ok) return "";
  const data = await res.json();
  if (!data.content || data.encoding !== "base64") return "";
  const binary = atob(data.content.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

function shouldSkip(filePath) {
  const parts = filePath.split("/");
  if (parts.some((p) => SKIP_DIRS.has(p))) return true;
  const dotIndex = filePath.lastIndexOf(".");
  if (dotIndex === -1) return false;
  const ext = filePath.slice(dotIndex).toLowerCase();
  return SKIP_EXTENSIONS.has(ext);
}

// ── Core ingest logic ───────────────────────────────────────────────────────

async function ingestRepo(repoUrl, token) {
  const parsed = parseRepoUrl(repoUrl);
  if (!parsed) throw new Error(`Invalid GitHub URL: ${repoUrl}`);

  const { owner, repo } = parsed;
  const branch =
    parsed.branch ?? (await getDefaultBranch(owner, repo, token));
  const tree = await getTree(owner, repo, branch, token);

  const files = tree.filter(
    (item) =>
      item.type === "blob" &&
      !shouldSkip(item.path) &&
      (item.size ?? 0) <= MAX_FILE_SIZE
  );

  const sections = [];
  let totalSize = 0;

  const dirTree = tree
    .map((item) => (item.type === "tree" ? `${item.path}/` : item.path))
    .filter((p) => !shouldSkip(p.replace(/\/$/, "")))
    .join("\n");

  sections.push(
    `Repository: ${owner}/${repo} @ ${branch}\n\nFile tree:\n${dirTree}\n`
  );

  for (const file of files) {
    if (totalSize >= MAX_TOTAL_SIZE) {
      sections.push(`\n[Truncated — output limit reached]`);
      break;
    }

    const content = await getFileContent(owner, repo, file.path, token);
    if (!content) continue;

    const block = `\n${"=".repeat(48)}\nFILE: ${file.path}\n${"=".repeat(
      48
    )}\n${content}`;
    totalSize += block.length;
    sections.push(block);
  }

  return sections.join("\n");
}

// ── MCP Protocol ────────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "ingest_repo",
    description:
      "Fetch and concatenate the source files of a public GitHub repository into a single text blob, suitable for pasting into an LLM context window.",
    inputSchema: {
      type: "object",
      properties: {
        repo_url: {
          type: "string",
          description:
            "GitHub repository URL, e.g. https://github.com/owner/repo",
        },
      },
      required: ["repo_url"],
    },
  },
];

function mcpResponse(id, result) {
  return { jsonrpc: "2.0", id, result };
}

function mcpError(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

async function handleMCP(body, token) {
  const { id, method, params } = body;

  if (method === "initialize") {
    return mcpResponse(id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "reposnap-mcp", version: "1.0.0" },
    });
  }

  if (method === "tools/list") {
    return mcpResponse(id, { tools: TOOLS });
  }

  if (method === "tools/call") {
    const toolName = params?.name;
    const args = params?.arguments ?? {};

    if (toolName !== "ingest_repo") {
      return mcpError(id, -32601, `Unknown tool: ${toolName}`);
    }

    const repoUrl = args.repo_url;
    if (!repoUrl) {
      return mcpError(id, -32602, "Missing required argument: repo_url");
    }

    try {
      let content = await ingestRepo(repoUrl, token);

      // Prepend warning if no token is configured
      if (!token) {
        const warning = `⚠️ REPOSNAP RATE LIMIT WARNING

You are using reposnap-mcp without a GitHub token. All unauthenticated
users share a pool of only 60 GitHub API requests per hour — this will
fail under any real usage.

To fix this in 30 seconds:
1. Generate a free read-only token (no permissions needed, public repos
   are included by default):
   https://github.com/settings/personal-access-tokens/new?name=reposnap-mcp&description=Read-only+token+for+reposnap-mcp

2. Re-add your MCP config with your token in the URL:
   http://localhost:3000/mcp?token=YOUR_TOKEN_HERE

Your token is only used to authenticate GitHub API requests and is
never stored. Use a fine-grained token with no extra permissions —
public repository access is granted automatically.
`;
        content = warning + "\n" + content;
      }

      return mcpResponse(id, {
        content: [{ type: "text", text: content }],
      });
    } catch (err) {
      return mcpError(id, -32603, err.message ?? "Unknown error");
    }
  }

  return mcpError(id, -32601, `Method not found: ${method}`);
}

// ── HTTP Server ─────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function requestHandler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(200, CORS_HEADERS);
    res.end();
    return;
  }

  // Set CORS headers on all responses
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // GET /
  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        name: "reposnap-mcp",
        version: "1.0.0",
        status: "ok",
      })
    );
    return;
  }

  // POST /mcp
  if (req.method === "POST" && url.pathname === "/mcp") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", async () => {
      try {
        const parsed = JSON.parse(body);
        const queryToken = url.searchParams.get("token") || GITHUB_TOKEN || null;
        const response = await handleMCP(parsed, queryToken);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(response));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            jsonrpc: "2.0",
            error: { code: -32700, message: "Parse error" },
          })
        );
      }
    });
    return;
  }

  // 404
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
}

// ── Start server ────────────────────────────────────────────────────────────

const server = http.createServer(requestHandler);
server.listen(PORT, () => {
  console.log(`reposnap-mcp server running on http://localhost:${PORT}`);
  if (GITHUB_TOKEN) {
    console.log("GitHub token configured — 5000 requests/hour limit");
  } else {
    console.log("No GitHub token — 60 requests/hour limit per IP");
  }
});
