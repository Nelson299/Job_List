// -----------------------------------------------------------------------
// GitHub-as-database configuration.
//
// SECURITY WARNING: This token ships to every browser that loads the site.
// Anyone who views page source can read it and use it to read/write this
// repo. Mitigate by:
//   1. Using a FINE-GRAINED personal access token scoped to ONLY this repo
//      (Settings > Developer settings > Fine-grained tokens), with
//      "Contents" permission set to Read and write, nothing else.
//   2. Never reuse a classic token or one with access to other repos.
//   3. Keeping this repo PRIVATE if your GitHub plan allows Pages on
//      private repos, or accepting that a public repo's data is public.
// This tradeoff was an explicit decision for an internal MVP with a small
// team — revisit it (e.g. add a serverless proxy to hide the token) if the
// app grows or starts holding more sensitive data.
// -----------------------------------------------------------------------
const CONFIG = {
  GITHUB_OWNER: "Nelson299",
  GITHUB_REPO: "Job_List",
  GITHUB_BRANCH: "main",
  GITHUB_TOKEN: "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",
};
