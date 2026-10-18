import test from "node:test"
import assert from "node:assert/strict"
import { sunoPlugin, ENDPOINT, INTEGRATION_ID, SERVER_NAME } from "../src/plugin.js"

function host(initialKey) {
  let key = initialKey
  let mcpTransform
  let wake
  const queue = []
  const state = { integrations: new Map(), methods: [], servers: new Map(), skills: new Map(), reloads: 0 }
  const editor = {
    get: (id) => state.servers.get(id),
    set: (id, value) => state.servers.set(id, value),
  }
  const ctx = {
    integration: {
      transform: async (fn) => fn({
        update: (id, fn) => {
          const entry = { id, name: id }
          fn(entry)
          state.integrations.set(id, entry)
        },
        method: { update: (value) => state.methods.push(value) },
      }),
      connection: {
        active: async () => key ? { type: "credential", id: "test" } : undefined,
        resolve: async () => ({ type: "key", key }),
      },
    },
    mcp: {
      transform: async (fn) => { mcpTransform = fn; fn(editor) },
      reload: async () => { state.reloads++; state.servers.clear(); mcpTransform(editor) },
    },
    skill: {
      transform: async (fn) => fn({ get: (id) => state.skills.get(id), add: (entry) => state.skills.set(entry.id, entry) }),
    },
    event: {
      subscribe: ({ signal }) => (async function* () {
        signal.addEventListener("abort", () => wake?.(), { once: true })
        while (!signal.aborted) {
          if (!queue.length) await new Promise((resolve) => { wake = resolve })
          if (signal.aborted) return
          while (queue.length) yield queue.shift()
        }
      })(),
    },
  }
  return {
    ctx, state,
    changeKey(value) { key = value; queue.push({ type: "credential.updated" }); wake?.() },
    async settled() { await new Promise((resolve) => setImmediate(resolve)) },
  }
}

test("installation registers native authentication and instruction without a key or generation", async () => {
  const h = host()
  const stop = await sunoPlugin.setup(h.ctx)
  assert.equal(h.state.integrations.get(INTEGRATION_ID).name, "Suno by Ace Data Cloud")
  assert.deepEqual(h.state.methods.map((m) => m.method.type), ["key", "env"])
  assert.equal(h.state.servers.get(SERVER_NAME).disabled, true)
  assert.equal(h.state.servers.get(SERVER_NAME).headers, undefined)
  const skill = h.state.skills.get("suno-by-acedatacloud")
  assert.match(skill.content, /Never resubmit a generation/)
  assert.match(skill.description, /Suno by Ace Data Cloud/)
  stop()
})

test("credential rotation and revocation replace in-memory headers at a fixed destination", async () => {
  const h = host("first-test-key")
  const stop = await sunoPlugin.setup(h.ctx)
  assert.equal(h.state.servers.get(SERVER_NAME).url, ENDPOINT)
  assert.equal(h.state.servers.get(SERVER_NAME).headers.Authorization, "Bearer first-test-key")
  h.changeKey("rotated-test-key")
  await h.settled()
  assert.equal(h.state.servers.get(SERVER_NAME).headers.Authorization, "Bearer rotated-test-key")
  h.changeKey(undefined)
  await h.settled()
  assert.equal(h.state.servers.get(SERVER_NAME).disabled, true)
  assert.equal(h.state.servers.get(SERVER_NAME).headers, undefined)
  assert.equal(h.state.reloads, 2)
  assert.doesNotMatch(JSON.stringify([...h.state.skills.values()]), /first-test-key|rotated-test-key/)
  stop()
})

test("a pre-existing user MCP entry is left intact", async () => {
  const h = host("test-key")
  const existing = { type: "remote", url: "https://user.example/mcp", disabled: true }
  h.state.servers.set(SERVER_NAME, existing)
  const stop = await sunoPlugin.setup(h.ctx)
  assert.equal(h.state.servers.get(SERVER_NAME), existing)
  stop()
})
