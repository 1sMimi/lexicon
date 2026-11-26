# Deployment

## Repository and privacy
Git is initialized locally. Never publish without the owner's explicit consent. Default new remote repository visibility is private. Source, public licensed dictionary packs and fonts may be committed; local imports, outputs, backups and credentials are ignored. Browser IndexedDB data is outside the repository and is not published with the app.

## GitHub authentication
Git and gh must be installed. If authentication is missing, run:

```sh
gh auth login --hostname github.com --git-protocol https --web
```

Complete the browser authorization yourself; do not send tokens/passwords to chat.

## Publish
After authentication, create the dedicated `lexicon` repository privately, push `main`, and enable Actions. Making it public requires explicit approval. GitHub Free Pages requires a public repository; paid plans can publish Pages from private repositories. Repository privacy does not automatically make a Pages website private.

Use Settings → Pages → Source → GitHub Actions. Then set the repository Actions variable `PAGES_DEPLOY_ENABLED` to `true` and rerun the workflow. The workflow installs locked dependencies, typechecks, tests, builds and deploys dist. Relative base and hash routing support /lexicon/ and custom domains. No secrets are required for the local-only app. Supabase is optional; see SYNC.md.

## Release verification
Verify the actual HTTPS Pages URL and /lexicon/ subpath, reload each route, install PWA on target devices, download resources then test offline, test service worker updates, and transfer a backup before switching origins. localhost browser data does not automatically transfer to github.io.

Cloud sync requires applying the SQL migration and real user-level RLS/conflict/network interruption tests with two clients. A mock-provider test is not a live cloud certification.
