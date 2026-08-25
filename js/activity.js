// Activity logging (one JSON file per month) + the two security-alert
// heuristics the admin asked for: rapid-fire actions and off-hours activity.

const Activity = (() => {
  function monthKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }

  function pathFor(key) {
    return `data/activity/${key}.json`;
  }

  // Fire-and-forget from the caller's perspective, but returns a promise if
  // you want to await it. Never throws to the caller's UI flow — logging
  // failures shouldn't block the user's actual action.
  async function logActivity(action, details = {}) {
    const user = Auth.getCurrentUser();
    const entry = {
      timestamp: new Date().toISOString(),
      userId: user ? user.id : "unknown",
      userName: user ? `${user.firstName} ${user.lastName}` : "unknown",
      action,
      details,
    };
    try {
      await GitHubAPI.updateJSON(
        pathFor(monthKey()),
        (current) => [...current, entry],
        `log: ${action} by ${entry.userName}`
      );
    } catch (err) {
      console.error("Failed to log activity", err);
    }
  }

  async function loadMonth(key) {
    const result = await GitHubAPI.getJSON(pathFor(key));
    return result ? result.data : [];
  }

  // Loads the last `n` months of activity (current month + n-1 prior),
  // combined and sorted oldest-first. Missing months are simply empty.
  async function loadRecentMonths(n = 3) {
    const now = new Date();
    const keys = [];
    for (let i = 0; i < n; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(monthKey(d));
    }
    const chunks = await Promise.all(keys.map(loadMonth));
    return chunks.flat().sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  // Rapid-fire: 10+ actions by the same user within any 60-second window.
  function findRapidFire(entries, threshold = 10, windowMs = 60 * 1000) {
    const byUser = {};
    entries.forEach((e) => {
      (byUser[e.userId] = byUser[e.userId] || []).push(e);
    });
    const alerts = [];
    Object.values(byUser).forEach((userEntries) => {
      userEntries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      for (let i = 0; i + threshold - 1 < userEntries.length; i++) {
        const windowStart = new Date(userEntries[i].timestamp).getTime();
        const windowEnd = new Date(
          userEntries[i + threshold - 1].timestamp
        ).getTime();
        if (windowEnd - windowStart <= windowMs) {
          alerts.push({
            type: "rapid-fire",
            userName: userEntries[i].userName,
            userId: userEntries[i].userId,
            count: threshold,
            from: userEntries[i].timestamp,
            to: userEntries[i + threshold - 1].timestamp,
          });
          i += threshold - 1; // don't re-flag overlapping windows repeatedly
        }
      }
    });
    return alerts;
  }

  // Off-hours: activity before 6am or after 9pm, local time of the browser
  // rendering the admin dashboard (data itself is stored in UTC ISO form).
  function findOffHours(entries, startHour = 6, endHour = 21) {
    return entries
      .filter((e) => {
        const hour = new Date(e.timestamp).getHours();
        return hour < startHour || hour >= endHour;
      })
      .map((e) => ({
        type: "off-hours",
        userName: e.userName,
        userId: e.userId,
        action: e.action,
        timestamp: e.timestamp,
      }));
  }

  function computeAlerts(entries) {
    return {
      rapidFire: findRapidFire(entries),
      offHours: findOffHours(entries),
    };
  }

  return { logActivity, loadMonth, loadRecentMonths, computeAlerts, monthKey };
})();
