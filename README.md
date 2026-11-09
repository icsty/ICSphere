# ICSphere

An academic information portal for RTU Institute of Computer Studies BSIT students.

## Continue on another machine

```powershell
git clone https://github.com/icsty/ICSphere.git
cd ICSphere
npm.cmd ci
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

Use a Node.js version supported by Vite 8 (20.19+ or 22.12+). On other platforms, use `npm` instead of `npm.cmd`. No Python runtime, model installation, or separate scanner process is required.

Create the ignored `.env` locally and obtain authorized configuration privately:

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://crzgazzspwarsbjvtfsl.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Frontend-safe publishable key for this project |
| `SUPABASE_URL` | Same authorized URL, for the server |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for application status and administrator APIs |

Never prefix server secrets with `VITE_`, commit environment files, or create an example environment file. Frontend layout previews can be used without server credentials. Restart Vite after changing configuration.

## Current state

- Dark landing page, official wordmark, responsive navigation, footer, and startup reveal. Titles use Montserrat; body text uses Hanken Grotesk.
- Google OAuth and securely checked account status through the existing Supabase project.
- Applicant personal details split into last name, first name, optional middle name, and optional suffix. Student number comes from the institutional email.
- Existing pending, approved, rejected, and deactivated applications retain their status screens and administrator review. Student access still requires approval.
- Approved schedules and profiles read saved registration details. Other academic modules retain empty states and need further backend work.

**New registration submissions are paused.** Automatic document processing has been removed. Personal details remain unsaved on the page; there is no upload/extraction/submission success simulation. A replacement document submission workflow must be implemented before accepting new applications.

Historical database migrations were already applied to `crzgazzspwarsbjvtfsl`. Cloning does not require rerunning them. Remote schema, private documents, audit records, and existing application data were preserved during scanner removal. Never reset or add test records to the shared production database automatically.

Hosting remains Vercel. Production deployment and the replacement document workflow remain unfinished. There is no container tooling requirement.

## Authentication and previews

The existing Google OAuth redirect allowlist must permit the exact local origin and production origin. Do not replace the configured provider or create another Supabase project. Google sign-in alone never grants student access.

Development-only previews: `/preview/onboarding`, `/preview/verification`, `/preview/dashboard`, `/preview/schedule`, `/preview/announcements`, `/preview/enrollment`, `/preview/resources`, and `/preview/profile`. They perform no data writes and are rejected in production builds.

## Checks

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd test
```

Optional: `node tests/browser-registration.mjs` needs Vite and Chrome CDP; its header documents the ports. It uses synthetic data and a mocked API. `node tests/check-client-secrets.mjs` checks built browser assets against the configured server secret without printing it. `npm.cmd run preview` serves static production assets only, without API functions.

See [handoff notes](docs/handoff.md), [registration state](docs/registration-setup.md), and [AGENTS.md](AGENTS.md). The consolidated project documentation describes intended features, not proof that every module is implemented.
