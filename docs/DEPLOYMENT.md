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

## Parallel Cloudflare and Supabase migration

Deploy the existing Vite build as Cloudflare Workers Static Assets, using `wrangler.jsonc`, `pnpm build`, and `pnpm dlx wrangler deploy` with an authenticated Cloudflare account. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as build variables. Leave `VITE_FIREBASE_WEB_CONFIG` unset on this deployment. Do not add private API keys, backups, or imported material to the build. Use a preview hostname before changing any public links. See [Cloudflare static assets](https://developers.cloudflare.com/workers/static-assets/).

If Cloudflare's dashboard is unavailable, use [Netlify's Git import](https://docs.netlify.com/deploy/create-deploys/) and select the migration branch as the site branch. Add the same public Supabase build variables before the first successful build. The checked-in `netlify.toml` publishes `dist` and fails before building when either variable is missing. The Supabase Site URL and callback must use the actual Netlify preview hostname for testing. Apply the final hostname only after the migration checks pass.

Configure the hosted project as described in [SYNC.md](SYNC.md). At the old site, first sync any pending data, then use **Export full backup** in the browser that holds the latest records. On the new origin, restore the backup before signing in and press **Sync now** to upload it. Downloads, browsers' installed PWA shortcuts and account credentials belong to their original origins. Cloud-only data needs to be pulled before export or migrated with an approved account-to-account mapping. Keep the old deployment and Firebase records available until the new site passes two-device sync and backup/restore checks.

## Keep the repository private on the current plan
The GitHub Pages API returned HTTP 422 for the private repository. A static build can be deployed independently on Cloudflare Pages with an authorized Cloudflare account. In Workers & Pages, choose Create application and Direct Upload, then upload the release ZIP with `index.html` at its root. Direct Upload publishes static assets and does not connect the repository. See https://developers.cloudflare.com/pages/get-started/direct-upload/.
