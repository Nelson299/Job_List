// Shared top navigation, injected into a <div id="nav-placeholder"></div>
// on every signed-in page. Keeps the admin link conditional on the current
// user without duplicating markup across pages.

function renderNav(activePage) {
  const el = document.getElementById("nav-placeholder");
  if (!el) return;
  const user = Auth.getCurrentUser();
  if (!user) return;

  const links = [
    ["jobs.html", "Jobs"],
    ["address-book.html", "Address Book"],
    ["contacts.html", "Contacts"],
    ["feedback.html", "Feedback"],
  ];
  if (user.isAdmin) links.push(["admin.html", "Admin"]);

  const linksHtml = links
    .map(
      ([href, label]) =>
        `<a href="${href}" class="${href === activePage ? "active" : ""}">${label}</a>`
    )
    .join("");

  el.innerHTML = `
    <nav class="topbar">
      <a href="jobs.html" class="brand">Static Electric Jobs</a>
      <div class="links">
        ${linksHtml}
        <span class="who">${user.firstName} ${user.lastName}${
    user.isAdmin ? ' <span class="badge admin">Admin</span>' : ""
  }</span>
        <button class="secondary small" id="sign-out-btn">Sign out</button>
      </div>
    </nav>
  `;

  document.getElementById("sign-out-btn").addEventListener("click", Auth.signOut);
}
