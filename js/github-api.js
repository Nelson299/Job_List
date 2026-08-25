// Thin wrapper around the GitHub Contents API used as our "database".
// All app data lives as files in this repo; every save is a git commit.

const GitHubAPI = (() => {
  const API_BASE = "https://api.github.com";

  function apiUrl(path) {
    return `${API_BASE}/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/contents/${path}`;
  }

  function headers() {
    return {
      Authorization: `Bearer ${CONFIG.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
    };
  }

  // UTF-8 safe base64 encode/decode (btoa/atob only handle latin1).
  function utf8ToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary);
  }

  function base64ToUtf8(b64) {
    const binary = atob(b64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  // Fetch a file. Returns { data, sha } where data is parsed JSON, or
  // null if the file does not exist yet (404).
  async function getJSON(path) {
    const res = await fetch(apiUrl(path) + `?ref=${CONFIG.GITHUB_BRANCH}`, {
      headers: headers(),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GitHub GET ${path} failed: ${res.status}`);
    const body = await res.json();
    return { data: JSON.parse(base64ToUtf8(body.content)), sha: body.sha };
  }

  // Write a JSON file. Pass sha of the current version to update it, or
  // omit/null to create a new file.
  async function putJSON(path, data, sha, message) {
    const res = await fetch(apiUrl(path), {
      method: "PUT",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        content: utf8ToBase64(JSON.stringify(data, null, 2)),
        branch: CONFIG.GITHUB_BRANCH,
        ...(sha ? { sha } : {}),
      }),
    });
    if (!res.ok) {
      const err = new Error(`GitHub PUT ${path} failed: ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }

  // Read-modify-write a JSON file with automatic retry on write conflicts
  // (409), which happen when two users save around the same time. mutateFn
  // receives the current data (or [] if the file doesn't exist yet) and
  // must return the new data to write.
  async function updateJSON(path, mutateFn, message, maxRetries = 3) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const existing = await getJSON(path);
      const current = existing ? existing.data : [];
      const next = mutateFn(current);
      try {
        await putJSON(path, next, existing ? existing.sha : null, message);
        return next;
      } catch (err) {
        const conflict = err.status === 409 || err.status === 422;
        if (conflict && attempt < maxRetries) continue;
        throw err;
      }
    }
  }

  // Upload a binary file (photo) given a base64 string (no data: prefix).
  // Returns the repo path (not a URL) — GitHub's download_url is a
  // short-lived signed link on private repos, so we re-fetch bytes through
  // the authenticated API instead of trusting a stored URL to stay valid.
  async function putBinary(path, base64Content, message) {
    const res = await fetch(apiUrl(path), {
      method: "PUT",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        content: base64Content,
        branch: CONFIG.GITHUB_BRANCH,
      }),
    });
    if (!res.ok) throw new Error(`GitHub PUT ${path} failed: ${res.status}`);
    const body = await res.json();
    return body.content.path;
  }

  // Fetch a binary file's raw base64 content (for rendering photos as
  // data: URIs). Returns null if the file doesn't exist.
  async function getBinaryBase64(path) {
    const res = await fetch(apiUrl(path) + `?ref=${CONFIG.GITHUB_BRANCH}`, {
      headers: headers(),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GitHub GET ${path} failed: ${res.status}`);
    const body = await res.json();
    return body.content.replace(/\n/g, "");
  }

  return { getJSON, putJSON, updateJSON, putBinary, getBinaryBase64 };
})();
