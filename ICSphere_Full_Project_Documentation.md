# ICSphere — Full Project Documentation

> **Implementation update — 2026-11-09:** Automatic document processing and its runtime/setup dependencies have been removed. New registration submissions are paused while the replacement document workflow is decided. Existing applications, administrator review, and applied database history are preserved. Scanner-specific requirements below are historical planning material, superseded by [the current README](README.md) and [registration state](docs/registration-setup.md); they are not installation instructions or active dependencies.

**Project title:** ICSphere: An Integrated Student Portal with AI Chatbot Assistance for the Institute of Computer Studies of Rizal Technological University  
**Project type:** Student-developed academic information portal  
**Primary audience:** BS Information Technology students of the Institute of Computer Studies (ICS), Rizal Technological University (RTU)  
**Document version:** 1.0  
**Prepared:** November 7, 2026  
**Document status:** Consolidated planning and implementation reference; not an independently audited as-built specification

> **Status convention:** **Finalized** = agreed product requirement or technology choice; **Planned** = intended workflow/architecture; **Verified** = explicitly supported by the available repository evidence or current setup; **To verify** = requires inspection of the current repository, Supabase project, or deployment. The latest available README snapshot described a Phase 1 scaffold; it may be older than subsequent development. Do not interpret this document as proof that all modules are deployed.

---

## 1. Executive Summary

ICSphere is a student-focused web portal intended to organize essential academic information and services for eligible RTU ICS BSIT students. It consolidates student schedules, priority announcements, enrollment guidance, academic resources, profile information, notifications, and guided AI assistance. Access is restricted through Google sign-in, registration-form OCR eligibility screening, and administrator approval.

The product prioritizes practical student workflows, controlled access to academic information, mobile-friendly usability, and a minimal, maintainable technology stack. It is **not** a replacement for the university's official records or enrollment systems.

### 1.1 Problem statement

Students may need to consult multiple sources for class schedules, academic announcements, enrollment instructions, and learning materials. This fragmentation can lead to missed information, repeated manual work, and uncertainty about which content is current. ICSphere provides a focused portal with administrator-managed information and student-specific academic views.

### 1.2 Project objectives

1. Centralize academic information for eligible ICS BSIT students.
2. Screen registration eligibility from official registration/assessment documents before granting access.
3. Provide a schedule-first dashboard and controlled schedule correction workflow.
4. Publish timely, prioritized academic announcements and organized resources.
5. Provide enrollment guidance without pretending to execute university enrollment transactions.
6. Offer optional reminders and guided portal assistance.
7. Provide administrators with approval and content-management capabilities.
8. Protect student data through restricted access, validation, least privilege, and data minimization.

### 1.3 Success criteria (proposed; targets not yet fixed)

- Eligible students can complete onboarding and track approval status.
- Ineligible applicants cannot activate student access.
- Approved students can access their own academic workspace.
- Student schedule data is reviewable and corrections are traceable.
- Administrators can publish, schedule, and revise academic content.
- Notification opt-in and opt-out are honored.
- Protected APIs and storage cannot be accessed by unapproved users.
- Essential flows are usable on desktop and mobile.

---

## 2. Scope and Boundaries

### 2.1 In scope — finalized MVP

- Google OAuth authentication and onboarding.
- Inactive student account creation and registration-form upload.
- PaddleOCR-based BSIT eligibility prescreening and administrator approval.
- Academic-focused student profiles, default avatars, optional photo upload, and privacy controls.
- Schedule-first dashboard.
- My Schedule with original OCR values retained, controlled edits, and overlap warnings.
- Priority-based, administrator-published announcements, approved attachments, external links, scheduled publication, and basic published revision history.
- Enrollment information and term-based guidance.
- Administrator-managed academic resources, browsable by My Subjects and All Resources.
- Guided, portal-focused chatbot with predefined prompts and limited AI explanations.
- Optional in-app class reminders and opt-in Web Push delivery (best effort).
- Single-role administrator management interface.

### 2.2 Out of scope / explicit exclusions

- Automatic execution of official enrollment or university transactions.
- Access for non-BSIT students as eligible users in the finalized MVP.
- General-purpose AI conversation or unrestricted tutoring.
- Guaranteed browser push delivery.
- Multiple administrator role tiers in the MVP.
- Unnecessary UI component libraries, API frameworks, ORMs, or extra infrastructure.
- Any unapproved assumption of real-time university system integrations, official grades, or authoritative academic record synchronization.

### 2.3 Dependencies and constraints

- Accuracy and legibility of uploaded registration/assessment forms.
- Availability and correctness of administrator-managed content.
- Browser support and user permission for Web Push.
- Supabase, Google OAuth, OpenRouter, hosting, and scheduling-service availability and quotas.
- University policy and consent/privacy requirements applicable to student data.
- Deployment constraints of OCR processing on the selected infrastructure.

---

## 3. Stakeholders and Roles

| Role | Main responsibilities / access |
|---|---|
| Visitor / unauthenticated user | View public landing content; begin Google sign-in |
| Applicant / pending student | Complete onboarding, submit registration form, see approval status; no approved-student resources |
| Approved BSIT student | Access own dashboard, schedules, announcements, resources, enrollment guides, profile, guided assistant, and notification settings |
| Administrator | Review applications, approve/reject access, publish and maintain academic content, manage resources and guides, review operational status |
| Project developers/maintainers | Implement, test, deploy, and maintain the portal and its security controls |

**Authorization rule:** Authentication is not equivalent to approval. A Google-authenticated but pending or rejected applicant must not receive approved-student permissions.

---

## 4. Functional Requirements

Requirements are written as testable behavior; identifiers can be used in implementation and QA tracking.

### 4.1 Authentication and registration

| ID | Requirement | Status |
|---|---|---|
| AUTH-01 | Provide Google OAuth sign-in | Finalized |
| AUTH-02 | Route new sign-ins to onboarding when no approved student profile exists | Finalized |
| AUTH-03 | Create an inactive/pending account before administrator approval | Finalized |
| AUTH-04 | Accept an RTU registration/assessment form for verification | Finalized |
| AUTH-05 | Use PaddleOCR to extract eligibility-relevant document information | Finalized |
| AUTH-06 | Block applicants who fail BSIT eligibility screening | Finalized |
| AUTH-07 | Route eligible submissions to administrator review | Finalized |
| AUTH-08 | Activate student privileges only after administrator approval | Finalized |
| AUTH-09 | Restrict protected pages, APIs, and data by approval status | Finalized |

**Planned registration flow:** Google sign-in → onboarding → upload form → validate file → OCR extraction → BSIT eligibility screening → pending admin review → approve/reject → activate approved-student access. Define retry/reupload paths for unreadable documents and administrative rejection reasons before release.

### 4.2 Student profile

| ID | Requirement |
|---|---|
| PROF-01 | Maintain an academic-focused student profile with essential fields only |
| PROF-02 | Offer default avatars and optional profile photo uploads |
| PROF-03 | Apply defined privacy controls and minimize exposed personal data |
| PROF-04 | Restrict profile edits to authorized fields and preserve relevant verification evidence |

### 4.3 Dashboard and schedules

| ID | Requirement |
|---|---|
| DASH-01 | Make the student's schedule the primary dashboard focus |
| DASH-02 | Surface prioritized announcements and useful upcoming academic information |
| SCH-01 | Store extracted schedule data associated with the student |
| SCH-02 | Permit controlled student corrections without overwriting original OCR values |
| SCH-03 | Warn about overlapping classes |
| SCH-04 | Permit confirmation of overlaps only after explicit acknowledgment |
| SCH-05 | Restrict schedule reads and edits to the owning student and authorized administrator processes |

**Schedule correction principle:** Keep the raw OCR-extracted values and the student-corrected values distinguishable, with provenance and timestamps. The portal's schedule is student-facing guidance unless independently reconciled with official university records.

### 4.4 Announcements

| ID | Requirement |
|---|---|
| ANN-01 | Only ICSphere administrators can create and publish announcements |
| ANN-02 | Support priority-based display |
| ANN-03 | Support approved attachments and external links |
| ANN-04 | Support scheduled publishing |
| ANN-05 | Keep a basic history of published revisions |
| ANN-06 | Students can browse published announcements; drafts remain inaccessible |

### 4.5 Enrollment information

| ID | Requirement |
|---|---|
| ENR-01 | Provide enrollment information and guidance only |
| ENR-02 | Organize guides by academic term |
| ENR-03 | Allow administrators to maintain published instructions and links |

### 4.6 Academic resources

| ID | Requirement |
|---|---|
| RES-01 | Administrators manage the resource library |
| RES-02 | Provide My Subjects and All Resources views |
| RES-03 | Support authorized attachments/links and suitable metadata |
| RES-04 | Prevent unauthorized access to private resource files |

### 4.7 Guided AI assistant

| ID | Requirement |
|---|---|
| AI-01 | Restrict the assistant to approved students |
| AI-02 | Provide guided, catalog-driven prompts and predefined messages |
| AI-03 | Use limited AI explanations grounded in portal information |
| AI-04 | Redirect unsupported or unrelated questions to portal features or official guidance |
| AI-05 | Clearly distinguish guidance from authoritative university decisions |

The finalized provider is OpenRouter. The assistant must not invent official schedules, approvals, deadlines, grades, or university policy.

### 4.8 Notifications and reminders

| ID | Requirement |
|---|---|
| NOTIF-01 | Support optional in-app class reminders |
| NOTIF-02 | Make browser push notifications explicitly opt-in |
| NOTIF-03 | Handle browser permissions, subscriptions, and service-worker delivery |
| NOTIF-04 | Use server-side sending with cron-job.org scheduling as planned |
| NOTIF-05 | Allow users to disable notifications and revoke subscriptions |
| NOTIF-06 | Treat delivery as best effort; avoid claims of guaranteed arrival |

### 4.9 Administrator panel

| ID | Requirement |
|---|---|
| ADM-01 | Provide one administrator role for the MVP |
| ADM-02 | Review OCR-eligible pending applications and approve/reject them |
| ADM-03 | Manage announcements, scheduling, revision history, guides, and resources |
| ADM-04 | Enforce administrator permissions on the server, not only in the UI |
| ADM-05 | Record important approval and publication actions for auditability |

---

## 5. Key User Journeys

### 5.1 New eligible student

1. Student signs in with Google.
2. The portal detects missing or unapproved onboarding.
3. Student completes minimal required profile information and uploads a registration/assessment form.
4. OCR extracts relevant data; eligibility rules screen for BSIT.
5. Eligible application becomes pending, with access restricted.
6. Administrator reviews the submission and supporting evidence.
7. Administrator approves; the student gains access to approved-student features.
8. Student reviews schedule, sets preferences, and uses the portal.

### 5.2 Ineligible or unreadable document

1. OCR returns insufficient or non-BSIT evidence.
2. The system does not activate the account.
3. It presents an appropriate error, retry, or review path, without exposing other students' records.
4. The administrator retains control of any manual exceptions if policy permits them; exception policy is **to define**.

### 5.3 Schedule correction

1. Student opens My Schedule and compares extracted values to the form.
2. Student edits an allowed field.
3. The system retains original OCR values and records the correction.
4. If a time overlap occurs, the system warns the student.
5. Student explicitly acknowledges the warning to confirm the overlapping entry.

### 5.4 Announcement publishing

1. Administrator creates an announcement, assigns priority, and adds approved links/files.
2. Administrator publishes immediately or schedules publication.
3. Only published content appears to students at the appropriate time.
4. Later published edits create a basic revision record.

### 5.5 Reminder delivery

1. Student enables reminders and, optionally, Web Push.
2. Browser permission is requested in context.
3. A push subscription is associated with the authorized student.
4. A scheduled server-side job evaluates due reminders and attempts delivery.
5. The student can disable reminders; delivery may fail due to browser/network/platform conditions.

---

## 6. Information Architecture and UX

### 6.1 Public / applicant areas

- Landing / welcome
- Google sign-in
- Onboarding and registration form submission
- Verification status and instructions

### 6.2 Approved-student areas

- Dashboard (schedule-first)
- My Schedule
- Announcements
- Enrollment Information
- Academic Resources: My Subjects / All Resources
- Student Profile and Preferences
- Guided AI assistance
- Notification settings

### 6.3 Administrator areas

- Pending application queue and verification review
- Announcement management and scheduling
- Enrollment guide management
- Resource library management
- Basic operational/audit views

### 6.4 UX principles

- Academic-first information hierarchy; prioritize next classes and relevant announcements.
- Mobile-responsive layouts and readable density; avoid decorative clutter.
- Explicit states for loading, empty data, pending verification, permission denied, and errors.
- Accessible form labels, keyboard navigation, focus states, and contrast.
- Explain OCR uncertainty and correction history clearly.
- Avoid presenting AI output as official university information.
- Require confirmation before destructive administrator actions.

**To verify:** Final screen inventory, routes, design tokens, responsive breakpoints, and screenshots against the current implementation.

---

## 7. Technology Stack and Architecture

### 7.1 Finalized stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| Backend | Node.js |
| Data | Supabase PostgreSQL |
| File storage | Supabase Storage |
| Authentication | Google OAuth (integrated with Supabase Auth in available scaffold) |
| OCR | PaddleOCR |
| AI provider | OpenRouter |
| Background scheduling | cron-job.org |
| Hosting | Vercel |

**Explicit exclusions:** No UI component library, API framework, or ORM in the agreed minimal stack. Avoid adding infrastructure merely for architectural fashion.

### 7.2 Logical architecture (planned)

```text
Student / Admin Browser
       |
       v
React + TypeScript + Vite + Tailwind
       |
       +---- Google OAuth / Supabase Auth
       |
       +---- Node.js server handlers / protected APIs
                     |
                     +---- Supabase PostgreSQL (RLS)
                     +---- Supabase private Storage
                     +---- OCR processing (PaddleOCR)
                     +---- OpenRouter (guided explanations)
                     +---- Web Push sender
                                  ^
                                  |
                            cron-job.org
```

This is a logical view, not a claim that all integrations are presently deployed. The deployment location and execution model for PaddleOCR need confirmation because the OCR runtime may not fit a lightweight Vercel function without special handling.

### 7.3 Authorization boundaries

- Browser authentication tokens are validated by protected server endpoints.
- RLS and server-side authorization both enforce user ownership and role/status.
- Sensitive provider keys and elevated Supabase credentials are server-only.
- Private uploads are accessed through controlled storage policies or short-lived authorized URLs.
- Scheduled jobs must authenticate their requests and be safe against duplicate execution.

### 7.4 Current repository evidence and limitations

The previously available project README described an initial runnable scaffold with React/TypeScript/Vite/Tailwind, Node.js TypeScript handlers, Supabase integration, Google sign-in, a health endpoint, a bearer-token `/api/me` endpoint, restricted student provisioning, and initial RLS work. It explicitly described OCR, approval UI, schedules, content, Web Push, chatbot, and full administrator UI as not yet implemented **at the time of that README**. Subsequent user reports indicate more development, but no current code audit has been performed for this document.

The current local checkout was cloned from `icsty/ICSphere` to `C:\Users\LENOVO\Desktop\ICSphere`; SSH authentication via `github-icsphere` and read access to the remote were confirmed in the current setup conversation. That does not verify module completion, deployment, or push authorization.

---

## 8. Data Model — Conceptual Specification

**Important:** The following entities and relationships are a recommended conceptual model derived from agreed features, **not** a verified copy of the existing Supabase schema. Inspect the live schema before writing SQL or migrations. The project preference is to manage database SQL directly in Supabase rather than introduce an ORM.

| Entity / table concept | Purpose / key fields (illustrative) |
|---|---|
| `profiles` | Auth user ID, academic profile, approval state, privacy settings |
| `verification_applications` | Applicant, document reference, OCR status, eligibility result, review state |
| `verification_reviews` | Application, administrator, decision, timestamp, reason |
| `academic_terms` | Academic year, semester, status |
| `subjects` | Subject code, title, metadata |
| `student_subjects` | Student-to-subject/term association |
| `schedule_entries` | Student, term, subject, day, start/end, room, provenance |
| `schedule_corrections` | Entry, original/extracted values, corrected values, actor, acknowledgment, timestamp |
| `announcements` | Title, body, priority, publish/schedule state, author |
| `announcement_revisions` | Published content snapshot/version and editor |
| `announcement_attachments` | File/link reference and access metadata |
| `enrollment_guides` | Term, content, links, publication state |
| `resources` | Subject association, file/link, metadata, publication state |
| `notification_preferences` | User preferences, reminder settings |
| `push_subscriptions` | User, endpoint/keys, lifecycle state |
| `reminder_events` | Student, scheduled reminder, send status, deduplication key |
| `admin_audit_events` | Actor, action, affected entity, timestamp |

### 8.1 Core relationships

- One authenticated user has at most one primary student profile.
- One student may submit multiple verification attempts; approval decisions reference applications.
- One student may have many schedule entries and corrections.
- Announcements and resources are administrator-authored and may reference files.
- A student may register multiple push subscriptions across devices.
- Academic terms contextualize schedules and enrollment guidance.

### 8.2 Integrity and access rules

- Apply unique constraints to stable identifiers where appropriate.
- Use foreign keys for user, term, subject, and content references.
- Avoid destructive overwriting of original OCR values.
- Ensure students can read/write only their own private data through RLS.
- Ensure pending applicants cannot query approved-student data.
- Limit administrative writes to authorized admin identities.
- Store private verification files in restricted buckets with retention controls.

### 8.3 Data dictionary and ERD work remaining

Generate an as-built data dictionary from the actual Supabase tables, columns, types, keys, indexes, RLS policies, triggers, and storage bucket policies. Do not use illustrative table names above as implementation instructions without reconciling them to the real database.

---

## 9. API and Integration Specification

**Verified from prior README snapshot:** health endpoint and bearer-token `/api/me` endpoint existed in the initial scaffold. Exact current paths, methods, payloads, and authorization code require inspection.

### 9.1 API domains to document from implementation

| Domain | Operations to inventory |
|---|---|
| Authentication/session | Session validation, current-user profile, onboarding state |
| Verification | Upload form, request OCR, retrieve application status, admin decision |
| Schedule | List own entries, submit correction, acknowledge overlap |
| Announcements | List published items, admin draft/schedule/publish/revise |
| Enrollment guides | List published term guides, admin maintain |
| Resources | Browse by subject, authorized file access, admin maintain |
| AI assistant | Fetch prompt catalog, submit restricted query, receive grounded explanation |
| Notifications | Read/update preferences, subscribe/unsubscribe, scheduled delivery |
| Admin | Protected approval queue, content management, audit events |

For each real endpoint, record HTTP method, path, auth requirements, role/status rules, request schema, response schema, error codes, rate limits, and side effects. **Do not infer routes from this conceptual list.**

### 9.2 External integrations

- **Google OAuth:** identity provider; configure redirect URLs for local and production origins.
- **Supabase:** Auth, PostgreSQL, Storage; use least-privilege policies.
- **PaddleOCR:** parse uploaded registration forms; validate extracted values and confidence/uncertainty.
- **OpenRouter:** server-mediated AI calls; do not expose provider API keys to the browser.
- **Web Push:** service worker and push subscription lifecycle.
- **cron-job.org:** authenticated recurring calls to evaluate due reminders and scheduled operations.
- **Vercel:** frontend and compatible server handlers; validate OCR execution constraints.

---

## 10. Security, Privacy, and Data Governance

### 10.1 Threats and safeguards

| Risk | Mitigation |
|---|---|
| Non-BSIT user bypasses screening | OCR is a prescreen only; administrator approval plus server-side role/status checks |
| User accesses another student's records | Ownership-aware RLS and protected API authorization |
| Forged client approval status | Never trust client-supplied roles or approval flags |
| Sensitive registration form disclosure | Private storage, restricted URLs, retention/deletion policy |
| Malicious file upload | File-type/size validation, safe processing, storage access controls |
| OCR misclassification | Manual review, uncertainty handling, original evidence retention as permitted |
| AI hallucination or data leakage | Guided prompts, grounding, limited context, server-side secrets, privacy filtering |
| Duplicate reminder sends | Idempotency keys, job locking or equivalent deduplication |
| XSS / injection | Output encoding, input validation, parameterized database access |
| Lost or leaked credentials | `.env` excluded from Git, secret rotation, least privilege |

### 10.2 Privacy principles

Collect only the data needed for eligibility and portal operation. Define lawful basis/consent language, access and correction mechanisms, retention periods for uploaded forms, administrator audit access, incident handling, and data deletion procedures in accordance with applicable university policy and Philippine privacy obligations. These policies require institutional review; this document does not claim legal compliance certification.

### 10.3 Environment variables

Use local `.env` for appropriate development configuration; keep secrets out of version control. Only expose frontend-safe variables through Vite's intended public environment mechanism. Do not put service-role keys, OpenRouter secrets, or other privileged tokens into client bundles. Maintain a redacted `.env.example` listing variable names without values.

### 10.4 Recommended checks before release

- Verify `.gitignore` excludes `.env` and private files.
- Confirm secrets are absent from commit history.
- Test RLS with anonymous, pending, approved, and admin identities.
- Test unauthorized API calls independently of UI restrictions.
- Verify signed/private file access and expiration behavior.
- Review OAuth redirect allowlists and deployed origin settings.
- Review file retention and administrative access logs.

---

## 11. Nonfunctional Requirements

| Category | Requirement / validation approach |
|---|---|
| Usability | Core tasks understandable without training; clear pending/error states |
| Responsiveness | Desktop and mobile layouts for all major student flows |
| Accessibility | Semantic controls, labels, keyboard access, visible focus, suitable contrast |
| Security | Enforced authorization, secure secret handling, restricted storage |
| Reliability | Graceful provider failures; retry and idempotency where needed |
| Performance | Avoid unnecessary client bundles and excessive database requests |
| Maintainability | Simple stack, readable TypeScript, documented SQL and environment setup |
| Observability | Useful error logging without leaking sensitive student content |
| Data integrity | Preserve original OCR evidence and correction provenance |
| Notifications | Best-effort push, explicit opt-in and opt-out |

Numeric SLOs, load targets, browser support matrix, and backup/restore objectives are **not yet finalized** and must be measured/approved rather than invented.

---

## 12. Development and Local Setup

### 12.1 Repository and identity

- GitHub repository: `icsty/ICSphere`
- Local checkout: `C:\Users\LENOVO\Desktop\ICSphere`
- Dedicated SSH alias: `github-icsphere`
- Remote form: `git@github-icsphere:icsty/ICSphere.git`
- Repository-local Git identity: `icsty` / `2024-201182@rtu.edu.ph`
- Existing Cali repository and its HTTPS authentication are separate and unchanged.

### 12.2 Initial setup

From a PowerShell terminal inside the repository:

```powershell
npm ci
npm run dev
```

`npm ci` is preferred because the repository contains `package-lock.json`. A fresh clone does not include `node_modules`; attempting `npm run dev` before installing dependencies can produce `'vite' is not recognized`.

### 12.3 Environment setup

1. Copy the correct ICSphere `.env` from an authorized source into the local project root.
2. Never reuse Cali's environment configuration.
3. Check that `.env` is ignored:

```powershell
git status --short --untracked-files=all
git check-ignore -v .env
```

4. Verify all required variables against the actual code and deployment settings; do not share their secret values in issue reports.

### 12.4 Git workflow

```powershell
git status
git pull --ff-only origin main
# make and test changes
git add <specific-files>
git commit -m "Describe the change"
git push origin main
```

Use feature branches and pull requests if required by the team. Avoid `git add .` until you have checked for secrets and generated files. The current Git remote has been tested for read access; write access should be validated on the first legitimate push.

---

## 13. Testing and Quality Assurance Plan

### 13.1 Test levels

- Unit tests for eligibility logic, schedule overlap rules, input validation, and reminder timing.
- Integration tests for Supabase authorization, OAuth callbacks, OCR handling, content publication, and AI provider failures.
- End-to-end tests for onboarding, pending approval, approval, dashboard access, schedule correction, and admin publishing.
- Security tests for RLS, role bypass, file access, injection, and secrets.
- Responsive/accessibility tests across agreed browsers and device sizes.
- User acceptance tests with representative students and administrator workflows.

### 13.2 Essential acceptance scenarios

| ID | Scenario | Expected result |
|---|---|---|
| QA-01 | Unauthenticated user opens protected page | Access denied or redirected |
| QA-02 | Pending student calls protected API | No approved-student data returned |
| QA-03 | Non-BSIT form submitted | Eligibility fails; no automatic approval |
| QA-04 | Eligible form submitted | Pending administrator review |
| QA-05 | Admin approves eligible applicant | Approved access becomes available |
| QA-06 | Student requests another student's schedule | Access denied |
| QA-07 | Student corrects OCR schedule value | Original retained; correction recorded |
| QA-08 | Student creates overlapping classes | Warning shown; explicit acknowledgment required |
| QA-09 | Non-admin attempts to publish announcement | Access denied |
| QA-10 | Announcement scheduled in future | Not publicly visible before publish time |
| QA-11 | Published announcement edited | Revision recorded |
| QA-12 | User declines push permission | Portal remains usable; no push subscription |
| QA-13 | Push delivery fails | Failure handled without claiming guaranteed delivery |
| QA-14 | AI asked unrelated/general question | Redirected to supported portal topics |
| QA-15 | Secret environment file checked against Git | File remains ignored and untracked |

**To verify:** Actual test framework, automated coverage, test data, run logs, defects, and sign-off records.

---

## 14. Deployment and Operations

### 14.1 Deployment plan

1. Verify environment variable names and secret storage.
2. Configure Google OAuth redirect URLs for production.
3. Configure Supabase project URL, policies, storage buckets, and authorized origins.
4. Build/test frontend and Node.js handlers in the target Vercel environment.
5. Validate OCR runtime feasibility and service integration.
6. Configure Web Push keys and service worker scope.
7. Configure authenticated cron-job.org jobs, schedules, and deduplication.
8. Run smoke tests for login, onboarding, protected APIs, student dashboard, and admin flows.
9. Monitor errors, provider failures, and delivery status.

### 14.2 Operational procedures to define

- Database backup and restore testing.
- Secret rotation and incident response.
- Failed OCR/review escalation.
- Content correction and publication rollback.
- Stale push-subscription cleanup.
- Dependency updates and vulnerability checks.
- Availability and error monitoring.
- Release and change-management records.

No production URL, monitoring service, retention period, backup frequency, or recovery objective is asserted here because these details have not been verified.

---

## 15. Development Phases and Project Status

### 15.1 Planning roadmap

1. **Foundation:** repository, frontend scaffold, Supabase, Google sign-in, initial access boundaries.
2. **Registration and verification:** upload, PaddleOCR, eligibility screening, approval workflow.
3. **Schedule and dashboard:** schedule extraction, corrections, overlaps, student overview.
4. **Academic content:** announcements, enrollment guides, resources, profiles, administrator content tools.
5. **Notifications:** preferences, Web Push, class reminders, scheduled delivery.
6. **Guided assistant:** predefined catalog and constrained OpenRouter explanations.
7. **Hardening and release:** QA, security/privacy review, accessibility, deployment, documentation.

This is a logical sequence, not a dated claim that the work was completed in that order.

### 15.2 Known status and evidence boundaries

| Item | Evidence / current status |
|---|---|
| Requirements and MVP decisions | Finalized in planning conversations |
| GitHub second-account SSH setup | Verified in current VS Code setup conversation |
| ICSphere remote clone and Git identity | Verified in current VS Code setup conversation |
| Remote repository read access | Verified with `git ls-remote origin HEAD` |
| `.env` copied into local checkout | Visible in user's VS Code screenshot; ignore status still to verify |
| Dependencies | `npm run dev` failed because Vite was unavailable; `npm ci` was the next step |
| Foundation implementation | Described in prior README snapshot |
| Other modules | User previously reported substantial/all module work, but present code and deployment have not been inspected; **to verify** |

### 15.3 Proposed as-built verification checklist

- [ ] Inspect current repository tree and package scripts.
- [ ] Inventory all pages, routes, components, and backend handlers.
- [ ] Compare implemented modules against requirement IDs in Section 4.
- [ ] Export/review Supabase schema, RLS, and storage policies.
- [ ] Verify Google OAuth and applicant approval end-to-end.
- [ ] Verify OCR engine/runtime and schedule extraction.
- [ ] Verify content publication and revision history.
- [ ] Verify push subscriptions, cron jobs, and reminder sending.
- [ ] Verify assistant scope restrictions and provider key security.
- [ ] Run build, tests, accessibility checks, and deployment smoke tests.
- [ ] Update this document with verified routes, table names, screenshots, and release status.

---

## 16. Risks, Assumptions, and Open Decisions

| Topic | Risk / open decision |
|---|---|
| OCR quality | Poor scans or unusual document layouts cause inaccurate extraction; define confidence/retry/manual review policy |
| Eligibility | Define precise BSIT evidence rules and rejection/reconsideration process |
| Student privacy | Confirm retention/deletion periods and institutional approval for storing registration forms |
| Official data | Portal may not have live authoritative university integrations; label data provenance |
| Schedule corrections | Define allowed fields, change history, and administrator visibility |
| Notification delivery | Browser/platform limitations, permission revocation, missed sends |
| OCR hosting | Confirm PaddleOCR runtime works within selected deployment limits |
| AI reliability | Limit hallucinations and exposure of student data; define allowed prompt catalog |
| Admin continuity | Single admin role is simple but creates operational dependency; define recovery process |
| Data schema | Reconcile conceptual model with actual Supabase schema before modifications |
| Release readiness | Require documented test results and security review rather than relying on feature-completion claims |

---

## 17. Documentation Maintenance

### 17.1 Suggested repository documentation structure

```text
ICSphere/
├── README.md
├── CHANGELOG.md
├── .env.example
└── docs/
    ├── 01-project-overview.md
    ├── 02-software-requirements-specification.md
    ├── 03-system-design.md
    ├── 04-database-and-rls.md
    ├── 05-api-and-integrations.md
    ├── 06-ui-ux-specification.md
    ├── 07-development-setup.md
    ├── 08-testing-and-qa.md
    ├── 09-deployment-and-operations.md
    ├── 10-security-and-privacy.md
    ├── 11-user-and-admin-guides.md
    └── assets/
```

This single consolidated document can be used as the source for those smaller maintainable files. It should not replace code-generated API/schema inventories or test evidence.

### 17.2 Change-control practice

- Update requirements when scope changes; preserve decision history.
- Mark every requirement as planned, implemented, tested, or deferred based on evidence.
- Record database changes and authorization-policy updates.
- Maintain deployment/release notes in `CHANGELOG.md`.
- Keep screenshots and test artifacts aligned with actual release versions.

---

## 18. Glossary

| Term | Meaning |
|---|---|
| ICS | Institute of Computer Studies |
| RTU | Rizal Technological University |
| BSIT | Bachelor of Science in Information Technology |
| OCR | Optical Character Recognition |
| RLS | Row Level Security (database access policies) |
| OAuth | Standard delegated authentication/authorization mechanism |
| Web Push | Browser-based push notification delivery |
| MVP | Minimum Viable Product |
| Admin approval | Explicit authorization step after eligibility prescreening |
| Schedule provenance | Record of whether a value came from OCR or student correction |

---

## 19. Finalized Decision Register

| Decision | Final selection |
|---|---|
| Primary users | RTU ICS BSIT students |
| Applicant workflow | Inactive account → upload form → OCR screening → admin approval |
| Authentication | Google OAuth |
| OCR engine | PaddleOCR |
| Dashboard | Schedule-first |
| Schedule corrections | Allowed with original OCR values retained |
| Overlaps | Warn and allow after acknowledgment |
| Announcements | Admin-only publication, priority-based, scheduling, revision history |
| Enrollment module | Information/guidance only, term-based |
| Academic resources | Admin-managed; My Subjects + All Resources |
| AI assistant | Guided, portal-focused, limited explanations; approved students only |
| Notifications | Optional reminders and opt-in Web Push; best effort |
| Admin roles | Single administrator role |
| Frontend | React + TypeScript + Vite + Tailwind |
| Backend | Node.js |
| Database/storage | Supabase PostgreSQL + Storage |
| AI provider | OpenRouter |
| Scheduling | cron-job.org |
| Hosting | Vercel |
| Architecture constraints | No UI library, API framework, ORM, or unnecessary complexity |

---

## 20. Source and Verification Notes

This document consolidates previous ICSphere project planning decisions, the prior project proposal/README information available in conversation context, and the current Git/VS Code setup evidence. It is designed to be comprehensive without fabricating live schema details, deployed endpoints, production URLs, security attestations, or completion evidence. The current codebase, database, and deployment should be inspected before calling it an **as-built technical specification**.

**Next maintenance action:** After local dependencies are installed and the project runs, perform a repository/database inventory and replace all **To verify** items with confirmed evidence.
