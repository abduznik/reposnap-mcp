import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const BASE_URL = "http://localhost:3000";
const MCP_URL = `${BASE_URL}/mcp`;

function startServer() {
  return spawn("node", ["server.js"]);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test("Server starts and responds to GET /", async () => {
  const server = startServer();

  try {
    await wait(1000);

    const response = await fetch(BASE_URL);
    const data = await response.json();

    assert.equal(response.status, 200);
    assert.equal(data.status, "ok");
  } finally {
    server.kill();
  }
});

test("Initialize MCP", async () => {
  const server = startServer();

  try {
    await wait(1000);

    const response = await fetch(MCP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
      }),
    });

    const data = await response.json();

    assert.equal(response.status, 200);
    assert.equal(data.jsonrpc, "2.0");
    assert.equal(data.result.protocolVersion, "2024-11-05");
    assert.equal(data.result.serverInfo.name, "reposnap-mcp");
  } finally {
    server.kill();
  }
});

test("List available MCP tools", async () => {
  const server = startServer();

  try {
    await wait(1000);

    const response = await fetch(MCP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
      }),
    });

    const data = await response.json();

    assert.equal(response.status, 200);
    assert.equal(data.jsonrpc, "2.0");
    assert.equal(data.result.tools.length, 1);
    assert.equal(data.result.tools[0].name, "ingest_repo");
  } finally {
    server.kill();
  }
});

test("Returns error for unknown method", async () => {
  const server = startServer();

  try {
    await wait(1000);

    const response = await fetch(MCP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 4,
        method: "hello",
      }),
    });

    const data = await response.json();

    assert.equal(response.status, 200);
    assert.equal(data.error.code, -32601);
    assert.equal(data.error.message, "Method not found: hello");
  } finally {
    server.kill();
  }
});

test("Returns parse error for invalid JSON", async () => {
  const server = startServer();

  try {
    await wait(1000);

    const response = await fetch(MCP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: "{",
    });

    const data = await response.json();

    assert.equal(response.status, 400);
    assert.equal(data.error.code, -32700);
    assert.equal(data.error.message, "Parse error");
  } finally {
    server.kill();
  }
});

test("Returns 404 for unknown route", async () => {
  const server = startServer();

  try {
    await wait(1000);

    const response = await fetch(`${BASE_URL}/unknown`);
    const text = await response.text();

    assert.equal(response.status, 404);
    assert.equal(text, "Not found");
  } finally {
    server.kill();
  }
});