# AGENTS.md — ICSphere

## 1. Project Overview

ICSphere is an academic information portal developed for Bachelor of Science in Information Technology (BSIT) students of Rizal Technological University (RTU), Institute of Computer Studies (ICS).

The platform centralizes academic schedules, announcements, enrollment guidance, academic resources, student profiles, and administrative workflows.

ICSphere is a student-focused academic portal, not a general-purpose social platform or learning management system.

## 2. Project Identity

- **Project:** ICSphere
- **Institution:** Rizal Technological University
- **Department:** Institute of Computer Studies
- **Primary users:** BSIT students
- **Repository:** `icsty/ICSphere`
- **Supabase project:** `crzgazzspwarsbjvtfsl`

ICSphere is completely independent of Cali.

Never reference, connect to, or modify Cali's repository, database, environment variables, authentication configuration, or infrastructure.

## 3. Technology Stack

Use the established technology stack:

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| Backend | Node.js |
| Database | Supabase PostgreSQL |
| File Storage | Supabase Storage |
| Authentication | Google OAuth |
| OCR | PaddleOCR |
| AI Integration | OpenRouter |
| Background Scheduling | cron-job.org |
| Notifications | Web Push |
| Hosting | Vercel |

### Technical Restrictions

- Do not introduce UI component libraries.
- Do not introduce API frameworks.
- Do not introduce ORMs.
- Avoid unnecessary dependencies.
- Do not introduce additional infrastructure without approval.
- Prefer existing project utilities and conventions.
- Keep implementations lightweight and maintainable.
- Do not replace established technologies without explicit permission.

## 4. Core Application Modules

### Authentication and Student Verification

- Google OAuth authentication.
- Registration onboarding for new students.
- Registration form upload.
- PaddleOCR eligibility screening.
- Administrator approval before account activation.
- Academic-focused student profiles.

OCR results must not automatically grant student access.

### Student Dashboard

- Schedule-first dashboard.
- Priority-based announcements.
- Relevant academic information.
- Optional student-controlled reminders.

### My Schedule

- Display academic schedules.
- Preserve original OCR-extracted values.
- Allow controlled schedule corrections.
- Detect overlapping classes.
- Allow overlap acknowledgment when appropriate.

### Announcements

- Administrator-only publishing.
- Priority-based announcements.
- Scheduled publishing.
- Approved attachments and external links.
- Basic published revision history.

### Enrollment Information

- Academic-term-based enrollment guides.
- Enrollment procedures and requirements.
- Informational assistance only.

### Academic Resources

- Administrator-managed resource library.
- Browse resources by enrolled subjects.
- Browse all available resources.

### AI Assistant

- Portal-focused academic assistance.
- Accessible only to approved students.
- Guided predefined prompts.
- Limited AI-generated explanations.
- No unrestricted general-purpose chatbot behavior.

### Notifications

- Optional Web Push notifications.
- Student-controlled class reminders.
- Service worker and push subscriptions.
- Server-side notification delivery.
- cron-job.org scheduling.
- Best-effort delivery.

### Administration

- Single administrator role.
- Student registration approval.
- Announcement management.
- Academic resource management.
- Enrollment guide management.
- Appropriate administrative access controls.

## 5. Database and Supabase Rules

The authorized Supabase project is:

`crzgazzspwarsbjvtfsl`

### Mandatory Safety Rules

1. Verify the linked Supabase project before performing remote database operations.
2. Default to read-only database inspection.
3. Never execute destructive SQL without explicit authorization.
4. Never drop tables, schemas, or databases without approval.
5. Never reset the remote database.
6. Never run migrations automatically.
7. Never run `supabase db push` without approval.
8. Never modify production data for testing.
9. Never expose database credentials or service-role keys.
10. Never access Cali's Supabase project.

### Database Development

- Use PostgreSQL through Supabase.
- Prefer direct, reviewed SQL in the Supabase SQL Editor.
- Maintain appropriate foreign keys, constraints, and indexes.
- Apply Row Level Security to exposed student data.
- Follow least-privilege access principles.
- Preserve academic data integrity.
- Do not assume client-side authorization is sufficient.
- Obtain approval before applying schema changes.

Database inspection commands must not be confused with permission to modify the database.

## 6. Authentication and Security

- Use the existing Google OAuth integration.
- Validate user sessions securely.
- Enforce administrator permissions server-side.
- Restrict protected student resources to authorized users.
- Protect uploaded registration documents.
- Never expose service-role credentials to frontend code.
- Do not commit `.env` files.
- Never log access tokens, passwords, or private keys.
- Avoid exposing unnecessary student personal information.
- Respect existing privacy and authorization requirements.

## 7. Frontend and UI/UX Standards

ICSphere should feel like a polished academic platform.

### Design Principles

- Professional and student-centered.
- Clean, readable, and organized.
- Consistent visual hierarchy.
- Responsive across desktop, tablet, and mobile.
- Accessible and keyboard-friendly.
- Purposeful interactions and restrained animations.
- Cohesive typography, spacing, and visual language.

### Avoid Generic AI-Generated UI

Do not introduce:

- Excessive dashboard cards.
- Unnecessary gradients and decorative glows.
- Generic two-column hero layouts everywhere.
- Arbitrary statistics or invented metrics.
- Repetitive rounded containers without clear purpose.
- Unnecessary animations.
- Decorative icons that add no meaning.
- Feature overload.

Prefer thoughtful layouts, strong information architecture, and practical academic workflows.

### Implementation Rules

- Use Tailwind CSS and existing project styling conventions.
- Do not add UI component libraries.
- Reuse established components.
- Keep components focused and maintainable.
- Support loading, empty, error, and success states.
- Preserve accessibility and responsive behavior.

### ICSphere Design System v1.0 — finalized visual rules

These rules supersede earlier provisional visual palettes. Apply them to all pages without changing existing layouts, routes, access boundaries, or business logic.

- **Fonts:** self-hosted Geist Sans (`Geist Variable`) for headings, body, navigation, controls, and tables. Use Geist Mono (`Geist Mono Variable`) only for course codes, identifiers, logs, and code. Font imports live in `src/main.tsx`.
- **Brand:** ICS Navy `#262535`, ICS Blue `#274CFF`, ICS Gold `#FFC123`, Slate Gray `#64748B`. Neutrals dominate. Blue identifies actions and selections; gold is a restrained accent, never normal body text or the dominant background. Use semantic status colors, not brand colors, for success/warning/error.
- **Source of truth:** `src/styles/tokens.css` defines brand, neutral, semantic, typography, spacing, radius, and motion tokens. `src/index.css` defines shared component classes and existing layouts. Do not create page-specific palettes or hardcode theme-dependent colors in components.
- **Light semantic tokens:** background `#F8FAFC`, surface `#FFFFFF`, foreground `#262535`, muted foreground `#64748B`, border `#E2E8F0`, primary `#274CFF`, primary foreground `#FFFFFF`, accent `#FFC123`.
- **Dark semantic tokens:** background `#11121A`, surface `#1C1D29`, foreground `#F8FAFC`, muted foreground `#A1A1B5`, border `#353645`, primary `#5470FF`, primary foreground `#FFFFFF`, accent `#FFC123`. Use supporting tokens for muted surfaces, readable links, controls, and statuses. Dark solid primary buttons use `--primary-action: #4662E8` to maintain AA white-label contrast; the specified `--primary` remains unchanged.
- **Tailwind v4:** use the existing CSS `@theme inline` mapping and class-based `@custom-variant dark`. Use semantic utilities such as `bg-surface`, `text-foreground`, `border-border`, and `font-mono`. Do not add a Tailwind v3 configuration or duplicate theme definitions.
- **Typography (size / weight / line-height):** page title 30px / 600 / 1.2; section 24px / 600 / 1.3; subsection 20px / 600 / 1.35; card heading 16px / 600 / 1.4; body 14px / 400 / 1.6; button 14px / 500 / 1.4; label 13px / 500 / 1.4; caption 12px / 400 / 1.5. Do not introduce oversized page headings or arbitrary weights.
- **Spacing:** use the centralized 4px-based spacing tokens. Prefer 4, 8, 12, 16, 24, 32, 48, and 64px; 20 and 40px are available for existing layouts. Keep responsive content widths and alignment consistent.
- **Radius:** small controls/badges 6px; buttons/inputs 8px; cards/panels 12px; large containers 16px; circles/pills only when appropriate. Do not wrap every section in a card.
- **Buttons:** retain existing `primary-button`, `secondary-button`, `text-button`, and `entrance-primary` APIs. New variants may use `button` with `button--primary`, `button--secondary`, `button--tertiary`, or `button--destructive`. Primary actions use `--primary-action` and `--primary-foreground`. Provide visible focus, disabled, and hover states; never rely on color alone.
- **Forms:** approximately 40px controls, semantic surface/border/text tokens, real labels, accessible placeholders, `aria-invalid` and explanatory error text where applicable. Display immutable Google account/program information as text, not focusable form controls.
- **Panels/tables:** neutral surfaces, thin borders, minimal shadows. Use `card` only where grouping helps; use `table-scroll` for responsive table overflow. Use restrained `badge` semantic variants with explicit status text.
- **Dialogs/dropdowns:** style native `dialog` and `dropdown-panel` surfaces using shared tokens. Use native selects where possible. Styling alone does not provide behavior: future custom dialogs/menus must implement labeling, Escape handling, focus management/restoration, and appropriate keyboard interactions. Prefer native `showModal()` for modal focus containment.
- **Theme management:** `public/theme.js` runs synchronously in the document head before React/styles initialize. It centrally manages root `.light`/`.dark`, native color scheme, localStorage key `icsphere.theme`, Light/Dark/System preferences, system changes, blocked-storage fallback, and cross-tab synchronization. Default is System. Reuse `ThemeSelect` (three labeled toggle buttons with `aria-pressed`)/the shared store; do not add independent theme state, theme providers, or alternate storage keys.
- **Landing presentation:** use the editorial academic composition: a typographic opening, asymmetric schedule/announcements spread, visible enrollment/resource articles, vertical access steps, and direct closing sign-in. No feature tabs or invented academic records. The landing may use `--text-display` (40–64px responsive hero) and `--text-feature` (32px section headings), with 96px desktop and 56px mobile section spacing. Application screen titles retain the 30px scale. Use neutral borders; reserve blue focus outlines for accessibility. Do not add colored border accents.
- **Startup splash:** initial markup outside the React root in `index.html` uses semantic theme tokens with native Canvas/CanvasText fallbacks. Animate only the indeterminate loading line; never show fake percentage progress. Keep the React root inert until dismissal. App mount emits `icsphere:ready`; `public/boot.js` fades the splash out over 180ms and releases the page, without a minimum display delay or auth dependency. Reduced motion disables the loading animation and skips the exit transition. Reveal recovery instructions and reload after 12 seconds if the app never mounts.
- **Icons:** Lucide React only; default 18px, small 16px, large 20–24px, consistent 1.75 stroke. Use icons for functional meaning; hide redundant icons from assistive technology and label icon-only controls.
- **Motion/accessibility:** use 150–200ms property-specific hover/focus transitions; panel transitions only when useful, 200–250ms. Respect reduced motion. Maintain WCAG AA text/control contrast, semantic HTML, labels, keyboard operation, visible focus, and responsive behavior. Preserve sticky-header focus offsets. Test both themes and all three preferences; do not equate build success with browser or accessibility verification.

## 8. Coding Standards

- Use TypeScript consistently.
- Avoid unnecessary `any` types.
- Prefer readable and maintainable code.
- Keep functions focused.
- Avoid duplicated logic.
- Follow existing naming conventions.
- Do not restructure unrelated modules.
- Do not overengineer simple features.
- Use existing dependencies whenever practical.
- Add comments when they clarify non-obvious behavior.

## 9. Development Workflow

Before implementation:

1. Inspect the relevant files.
2. Understand the existing architecture.
3. Identify dependencies and affected modules.
4. Explain the proposed changes for substantial work.
5. Ask for clarification when requirements are ambiguous.

During implementation:

1. Make focused changes.
2. Preserve existing working features.
3. Avoid unrelated refactoring.
4. Follow the established technology stack.
5. Keep database operations within approved scope.

After implementation:

1. Run relevant checks when available.
2. Verify TypeScript compilation.
3. Check for linting errors.
4. Test affected functionality where practical.
5. Summarize changes.
6. Report unresolved issues and limitations.

Never claim a test passed unless it was actually executed.

## 10. Git and Repository Rules

- Work only within the ICSphere repository.
- Preserve the existing Git history.
- Do not force-push.
- Do not rewrite commit history without approval.
- Do not automatically commit or push changes.
- Do not modify unrelated files.
- Never commit credentials or environment files.
- Keep Supabase temporary files ignored.
- Use clear and descriptive commit messages when requested.

## 11. Scope Control

ICSphere is an MVP-focused project.

Prioritize essential academic functionality, reliability, security, usability, and maintainability.

Do not introduce features simply because they are technically possible.

Avoid unnecessary complexity, speculative abstractions, and premature optimization.

Propose substantial new features before implementing them.

## 12. Agent Behavior

When working on ICSphere:

- Treat this file as the default project instruction set.
- Prioritize correctness over speed.
- Respect established architectural decisions.
- Avoid assumptions about database structure.
- Inspect existing code before changing it.
- Ask before destructive or irreversible operations.
- Explain technical decisions concisely.
- Prefer simple solutions over elaborate architecture.
- Never invent successful test results.
- Never expose secrets.
- Never access unrelated projects.

**Primary objective:** Build and maintain ICSphere as a secure, reliable, accessible, and well-designed academic portal for RTU BSIT students without unnecessary complexity.
