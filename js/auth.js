// Name-only sign-in against the pre-created list in data/users.json.
// No password. Session lives in sessionStorage (cleared when the tab closes).

const Auth = (() => {
  const SESSION_KEY = "sc_current_user";

  function getCurrentUser() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  function setCurrentUser(user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }

  function signOut() {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = "index.html";
  }

  async function sha256Hex(text) {
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  // Looks up a user by first+last name (case-insensitive, trimmed). Admin
  // accounts additionally require a matching password (checked against
  // passwordHash). The admin list itself is fixed and managed by directly
  // editing data/users.json — this app has no "make admin" UI.
  //
  // Returns one of:
  //   { ok: true, user }
  //   { ok: false, reason: "not_found" }
  //   { ok: false, reason: "password_required" }
  //   { ok: false, reason: "bad_password" }
  async function signIn(firstName, lastName, password) {
    const result = await GitHubAPI.getJSON("data/users.json");
    const users = result ? result.data : [];
    const match = users.find(
      (u) =>
        u.firstName.trim().toLowerCase() === firstName.trim().toLowerCase() &&
        u.lastName.trim().toLowerCase() === lastName.trim().toLowerCase()
    );
    if (!match) return { ok: false, reason: "not_found" };

    if (match.isAdmin) {
      if (!password) return { ok: false, reason: "password_required" };
      const hash = await sha256Hex(password);
      if (hash !== match.passwordHash) return { ok: false, reason: "bad_password" };
    }

    setCurrentUser(match);
    return { ok: true, user: match };
  }

  // Call at the top of any protected page. Redirects to sign-in if no
  // session exists.
  function requireAuth() {
    const user = getCurrentUser();
    if (!user) {
      window.location.href = "index.html";
      return null;
    }
    return user;
  }

  // Call at the top of admin.html. Redirects non-admins back to jobs.html.
  function requireAdmin() {
    const user = requireAuth();
    if (user && !user.isAdmin) {
      window.location.href = "jobs.html";
      return null;
    }
    return user;
  }

  return { getCurrentUser, signIn, signOut, requireAuth, requireAdmin };
})();
