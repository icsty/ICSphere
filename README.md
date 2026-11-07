# ICSphere

A student-developed academic information portal for RTU Institute of Computer Studies BSIT students.

## Current implementation

The public landing page uses an editorial academic composition: an opaque sticky masthead, a typographic opening with direct Google sign-in, an asymmetric schedule/announcements feature spread, enrollment and resource articles, and a vertical access walkthrough. All four academic tools are visible without tabs or hidden panels. Borders remain neutral. All screens share the ICSphere Design System v1.0.

## Design system and themes

Visual tokens live in `src/styles/tokens.css`; existing layouts and shared component styles live in `src/index.css`. Geist Sans and Geist Mono are self-hosted through Fontsource; Lucide React supplies functional icons. Navy/neutral surfaces, blue interactions, restrained gold accents, shared typography, spacing, and radius rules apply across landing, student, and access-state screens. See `AGENTS.md` for the complete design conventions.

Three theme toggle buttons support Light, Dark, and System, with accessible labels and pressed states. `public/theme.js` applies the theme and native color scheme in the document head before React starts, persists `icsphere.theme`, follows system changes when requested, synchronizes tabs, and continues in memory if storage is blocked. `ThemeSelect` uses the same store everywhere. No account or Supabase settings are changed. Dark action and link tokens are adjusted for AA contrast while preserving the requested primary brand token.

The startup splash in `index.html` adapts to that same theme, including before app CSS arrives via native Canvas/CanvasText fallbacks. An indeterminate loading line animates while the app loads. The splash sits outside the React root, which remains inert until startup finishes. On React mount, `public/boot.js` fades the splash out over 180ms, removes it, and releases the page. Reduced motion disables the loading animation and removes the splash immediately on readiness. There is no minimum display delay or fake percentage progress. If loading fails, connection guidance and a working reload action appear after 12 seconds.

Shared table, badge, card, native dialog, and button-variant styles are available for future content; no new data tables, dialogs, or application workflows are introduced. Custom future menus/dialogs still require appropriate accessible behavior, not just these styles.

Its primary Continue with Google button and header sign-in button open Google OAuth directly. The page explains the audience, current sign-in availability, and registration/approval requirements before introducing the planned academic tools. Google sign-in uses the existing Supabase provider, restores browser sessions, and supports signing out of the current browser. On initial sign-in or session restoration at the landing page, the user enters registration.

Eight primary student screens are implemented: registration/onboarding, verification status, dashboard, schedule, announcements, enrollment information, academic resources, and profile. They provide the frontend structure and honest empty states. Registration inputs are temporary, unsaved drafts; uploads and submissions are unavailable. Approval, persistence, academic data, and backend authorization are not connected yet. Search, filters, and view controls operate on the currently empty collections.

## Screen navigation and local previews

The app uses clean pathname routes with the browser History API, including Back/Forward support, without a routing dependency. Signed-in users can open `/onboarding` and `/verification`. Landing navigation scrolls to the academic articles and access section without adding fragments to the URL. All academic routes remain restricted because a trusted approval lookup is not connected. A session alone never unlocks those screens.

Vite serves the SPA for direct links during local development and production preview. The checked-in `vercel.json` adds the SPA fallback to `/index.html` for Vercel deep links and refreshes. This hosting change takes effect on the next deployment; no deployment is performed by this change.

For local design review, run `npm run dev` and append one of these paths to its printed origin:

| Screen | Local development URL suffix |
| --- | --- |
| Registration | `/preview/onboarding` |
| Verification status | `/preview/verification` |
| Dashboard | `/preview/dashboard` |
| My schedule | `/preview/schedule` |
| Announcements | `/preview/announcements` |
| Enrollment information | `/preview/enrollment` |
| Academic resources | `/preview/resources` |
| My profile | `/preview/profile` |

Previews are available only in Vite development mode and display an explicit preview notice. They require no login, fetch no student records, and perform no uploads or account writes. Production builds reject preview routes, including when an authenticated user guesses their URLs. Use the preview sidebar to move between screens. These previews are UI review tools, not authorization for future data APIs.

Authentication is not student approval. No protected student records are fetched, and no role or approval is inferred from Google identity. Future protected APIs must validate sessions and enforce authorization server-side and through database policies.

## Local development

Use a Node.js version supported by Vite 8 (20.19+ or 22.12+).

1. Run `npm ci`.
2. Retain your existing ICSphere `.env`, or obtain the project’s frontend-safe configuration from an authorized maintainer.
3. Set `VITE_SUPABASE_PUBLISHABLE_KEY` to the project's frontend-safe publishable key. Never use a service-role key or Google client secret.
4. Run `npm run dev` and open the printed local address.

On Windows, use `npm.cmd` if PowerShell blocks `npm.ps1`. The public page remains available without valid configuration; sign-in is disabled with an explanation. Environment changes require restarting Vite.

## Existing authentication configuration

The only supported Supabase project is `crzgazzspwarsbjvtfsl`. Both variables prefixed with `VITE_` are public browser configuration. Keep `.env` untracked.

Google OAuth is already configured externally; do not create a replacement project or provider. Sign-in uses Supabase's PKCE flow and returns to the current origin's root (`/`). The existing Supabase redirect allowlist must permit the exact development origin (normally `http://localhost:5173/`) and production origin. If Vite selects another port, its origin must also be allowed, or the occupied port must be freed. The Google provider callback remains the existing Supabase callback, not the frontend root.

Remote allowlist settings have not been inspected or changed. If Google sign-in returns to another origin or fails, check the existing Supabase Auth redirect settings. Supabase handles the returned authorization code; the page removes callback parameters after session initialization and shows a retry message on failure. Provider error details and tokens are not rendered or logged by application code.

## Checks

- `npm run build`: TypeScript compilation and Vite production build.
- `npm run lint`: Oxlint.
- `npm test`: isolated tests covering the mocked authentication lifecycle, direct OAuth CTA behavior, clean History API navigation, route restrictions, development-only previews, screen rendering, theme persistence/system synchronization, and token contrast. These do not contact the live provider or replace browser testing.
- `npm run preview`: serve the production build locally.

Manual acceptance: verify Get started opens Google OAuth directly, sign-in returns to registration, session persistence after refresh, sign-out, cancelled sign-in, and provider/network errors. Review all eight local previews and check sidebar navigation, schedule views, resource collections, filters, keyboard access, focus visibility, and layouts at mobile, tablet, and desktop widths. Verify preview URLs are rejected under `npm run preview` (which serves a production build). Live OAuth testing requires an interactive Google account and the correct redirect allowlist; build success does not verify it.

## Development boundaries

React, TypeScript, Vite, Tailwind CSS, and Supabase are retained. Hosting remains Vercel; this change does not deploy. No database schema, storage, or provider configuration changes are included.

See `AGENTS.md` for repository rules and `ICSphere_Full_Project_Documentation.md` for the broader requirements. Historical implementation claims in the consolidated document are not evidence that those modules exist in this checkout.
