import assert from "node:assert/strict"
import { execFileSync, spawn } from "node:child_process"
import { createHash, randomBytes } from "node:crypto"
import { once } from "node:events"
import { mkdtemp, readFile, mkdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { createInterface } from "node:readline"
import { fileURLToPath } from "node:url"
import { INTEGRATION_ID, SERVER_NAME } from "../src/plugin.js"

// Real host + packed artifact acceptance, without credentials or model/media requests.
const root = fileURLToPath(new URL("../", import.meta.url))
const manifest = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"))
const binary = process.env.OPENCODE_BIN
assert(binary, "Set OPENCODE_BIN to the exact OpenCode 2 executable to verify")
const version = execFileSync(binary, ["--version"], { encoding: "utf8", timeout: 10000 }).trim()
assert.equal(version, "opencode v2.0.26", "This acceptance fixture targets OpenCode 2.0.26")
const sourceHead = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim()
const dirty = execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }).trim() !== ""
const directory = await mkdtemp(path.join(tmpdir(), "opencode-plugin-e2e-"))
let child
let childExit
let diagnostics = ""
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

try {
  const packed = JSON.parse(execFileSync("npm", ["pack", "--json", "--pack-destination", directory], {
    cwd: root, encoding: "utf8", timeout: 30000,
  }))[0]
  const archive = path.join(directory, packed.filename)
  execFileSync("tar", ["-xzf", archive, "-C", directory], { timeout: 10000 })
  const packageRoot = path.join(directory, "package")
  const workspace = path.join(directory, "workspace")
  await mkdir(workspace)
  const config = path.join(workspace, "opencode.json")
  await writeFile(config, JSON.stringify({ plugins: [packageRoot] }))
  const emptyCatalog = path.join(directory, "models.json")
  await writeFile(emptyCatalog, "{}")
  const env = Object.fromEntries(
    ["PATH", "HOME", "SYSTEMROOT", "SystemRoot", "TMPDIR", "TEMP", "TMP"].flatMap((key) =>
      process.env[key] === undefined ? [] : [[key, process.env[key]]]),
  )
  Object.assign(env, {
    XDG_CONFIG_HOME: path.join(directory, "config"),
    XDG_DATA_HOME: path.join(directory, "data"),
    XDG_CACHE_HOME: path.join(directory, "cache"),
    XDG_STATE_HOME: path.join(directory, "state"),
    OPENCODE_CONFIG: config,
    OPENCODE_DISABLE_PROJECT_CONFIG: "true",
    OPENCODE_DISABLE_FILEWATCHER: "true",
    OPENCODE_DISABLE_MODELS_FETCH: "true",
    OPENCODE_MODELS_PATH: emptyCatalog,
    OPENCODE_SERVER_PASSWORD: randomBytes(24).toString("hex"),
  })
  child = spawn(binary, ["serve", "--stdio", "--hostname", "127.0.0.1", "--port", "0"], {
    cwd: workspace, env, stdio: ["pipe", "pipe", "pipe"],
  })
  childExit = once(child, "exit")
  child.stderr.on("data", (chunk) => { diagnostics = (diagnostics + chunk).slice(-16000) })
  const lines = createInterface({ input: child.stdout })
  const address = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Private OpenCode server did not announce its URL")), 15000)
    lines.once("line", (line) => {
      clearTimeout(timeout)
      try { resolve(JSON.parse(line).url) } catch (error) { reject(error) }
    })
    child.once("error", (error) => { clearTimeout(timeout); reject(error) })
    child.once("exit", () => { clearTimeout(timeout); reject(new Error("Private server exited before startup")) })
  })
  assert.equal(new URL(address).hostname, "127.0.0.1")
  const auth = `Basic ${Buffer.from(`opencode:${env.OPENCODE_SERVER_PASSWORD}`).toString("base64")}`
  async function get(domain) {
    const url = new URL(`/api/${domain}`, address)
    url.searchParams.set("directory", workspace)
    const response = await fetch(url, { headers: { Authorization: auth }, signal: AbortSignal.timeout(10000) })
    assert(response.ok, `${domain}: HTTP ${response.status}`)
    const value = await response.json()
    return Array.isArray(value) ? value : value.data
  }
  let snapshot
  for (let attempt = 0; attempt < 10; attempt++) {
    const integrations = await get("integration")
    const servers = await get("mcp")
    const skills = await get("skill")
    const plugins = await get("plugin")
    snapshot = {
      integration: integrations.find((entry) => entry.id === INTEGRATION_ID),
      server: servers.find((entry) => entry.name === SERVER_NAME),
      skill: skills.find((entry) => entry.id === SERVER_NAME),
      plugin: plugins.find((entry) => entry.id === INTEGRATION_ID.replace("acedatacloud-", "acedatacloud.")),
    }
    if (snapshot.integration && snapshot.server && snapshot.skill && snapshot.plugin) break
    await wait(250)
  }
  assert.equal(snapshot.plugin?.state.status, "active", "Packed plugin must be active")
  assert.match(snapshot.integration?.name ?? "", /by Ace Data Cloud$/)
  assert.deepEqual(snapshot.integration.connections, [], "No credentials may be inherited")
  assert.deepEqual(snapshot.integration.methods.map((entry) => entry.type).sort(), ["env", "key"])
  assert.equal(snapshot.server?.status.status, "disabled", "No-key installation must not connect a remote MCP")
  assert(snapshot.skill?.content.includes("Never resubmit a generation"), "Bundled Skill must keep same-task guidance")
  const evidence = {
    checked_at: new Date().toISOString(), source_head: sourceHead, working_tree_dirty: dirty,
    package: manifest.name, package_version: manifest.version, host_version: version,
    installation: "npm pack → extract package → private real OpenCode server (not remote Git installer)",
    packed_files: packed.files.map((entry) => entry.path),
    package_sha256: createHash("sha256").update(await readFile(archive)).digest("hex"),
    results: { plugin: "active", integration: snapshot.integration.name, methods: ["key", "env"],
      credentials: 0, mcp: "disabled", skill: snapshot.skill.name },
    limits: "No key, live auth, tool call, model/media generation, task result, billing or acquisition is tested here.",
  }
  const output = process.env.OPENCODE_E2E_OUTPUT
  if (output) {
    await mkdir(path.dirname(path.resolve(output)), { recursive: true })
    await writeFile(output, JSON.stringify(evidence, null, 2) + "\n")
  }
  console.log(JSON.stringify(evidence, null, 2))
} catch (error) {
  // Keep credentials out of diagnostics even if the host ever prints its local password.
  console.error(diagnostics.replace(/(password\s+)[^\s]+/gi, "$1[REDACTED]"))
  throw error
} finally {
  if (child && child.exitCode === null && child.signalCode === null) {
    child.stdin.end()
    await Promise.race([childExit, wait(3000)])
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGTERM")
      await childExit
    }
  }
  await rm(directory, { recursive: true, force: true })
}
