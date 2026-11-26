# Hosted Firebase sync

## Project owner setup

1. In Firebase project `lexicon-2dcaa`, register a Web App for Lexicon. Use its public Web App configuration JSON as the GitHub Actions repository variable `FIREBASE_WEB_CONFIG`. Use only `apiKey`, `authDomain`, `projectId` and `appId`. Do not use a service account, private key, OAuth Client Secret or administrator access token. If the variable is absent, the existing local experience and optional Supabase settings remain available.
2. In Firebase Authentication, enable **Email/Password** and add the `1smimi.github.io` authorized domain. Email users must verify their email before Firestore accepts sync requests.
3. Enable the **GitHub** provider in Firebase Authentication. Follow https://firebase.google.com/docs/auth/web/github-auth to create a GitHub OAuth App and copy the Firebase provider's callback URL into GitHub. Enter the OAuth Client ID and Client Secret directly in Firebase Authentication. Keep the Client Secret out of GitHub source and Actions variables.
4. Create the default Firestore database in production mode. Publish `firestore.rules` in the Firebase Rules editor, or deploy those rules with the Firebase CLI while authenticated as the project owner.
5. Redeploy the Pages workflow after setting the public Web config. Confirm email sign-up, verification, GitHub sign-in, cross-user isolation, and replication of a test word or test note across two browser profiles. Do not announce cloud sync as live before these checks pass.

Existing users can continue without an account. Cloud sign-in authorizes this browser's learning records to sync. Use the same sign-in method on both devices and a separate browser profile for different people. Original reading files, reading marks and study drafts remain local. Oversized journal screenshots may exceed Firestore's document limit; a failed sync retains the local record. Firebase config has no dependency on Supabase. Existing Supabase-bound local profiles should use backup/restore in a separate profile pending an account migration flow.

## Staged activation
The Pages workflow probes an anonymous collection read against the configured Firestore project before building hosted sync. The release stops unless Firestore responds `PERMISSION_DENIED`. This checks anonymous denial only; verify that signed-in users cannot access another UID and that legitimate writes succeed as part of the authenticated smoke test. Set `FIREBASE_GITHUB_ENABLED=true` only after registering the OAuth callback and enabling GitHub in Firebase. Email sign-in can be enabled first.
