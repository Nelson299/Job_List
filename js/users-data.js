// Static employee/admin roster — the single source of truth for sign-in.
// No GitHub API call, no token needed: this ships as a plain file in the
// site itself, so sign-in works on the hosted GitHub Pages site too.
//
// To add someone: append an entry below and push.
// For an admin, generate passwordHash first with
// admin-password-hash-tool.html, then paste it in here.
const USERS = [
  {
    id: "Software Admin",
    firstName: "Ellinore",
    lastName: "Nelson",
    isAdmin: true,
    passwordHash: "057ba03d6c44104863dc7361fe4578965d1887360f90a0895882e58a6248fc86",
    phone: "",
    email: "",
    dateAdded: "2026-08-24",
  },
];
