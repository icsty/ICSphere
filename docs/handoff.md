# Development handoff

The repository includes the frontend, Node API, official brand asset, validation/tests, and applied migration history. There are no Python dependencies or scanner installation steps.

Local environment files, Node modules, build output, browser screenshots, and Supabase temporary configuration are excluded from Git. Obtain authorized environment values privately and follow the README. The original workstation's `github-icsphere` SSH alias is machine-specific; the clone URL is `https://github.com/icsty/ICSphere.git`.

Only Supabase project `crzgazzspwarsbjvtfsl` is authorized. Its application schema and private storage were applied on 2026-11-08. The designated contact account has administrator access. Database state is remote and is not copied by Git. Never rerun historical migrations or reset the shared database to set up a clone.

Automatic document processing has been removed. Existing application status/review and approved access remain. New uploads/submissions are paused; personal details on onboarding are unsaved. The next workflow decision is manual document review or another explicitly chosen processing approach. Implement it with a forward migration and real persistence, without fabricated screening results.

Run build, lint, and tests after cloning. Browser tests use a mocked API and synthetic records. A complete real login/upload/approval transaction has not been exercised in production; use isolated staging for persistence and concurrency checks.

Vercel deployment remains unfinished. No alternate hosting provider, container tool, or example environment file should be introduced by assumption. Changes remain uncommitted for the user to review, commit, and push.
