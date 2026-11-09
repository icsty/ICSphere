# Registration state after scanner removal

Automatic document scanning and extraction have been removed from active source, setup scripts, dependencies, local runtime/model files, and local environment configuration. No replacement processor has been introduced.

## What still works

- Google OAuth, institutional-email validation, separate name fields, and immutable account identity.
- Reading existing application status from the authorized Supabase project.
- Administrator queues, private original-document links, decision reasons, version checks, and approve/reject/deactivate actions for existing applications.
- Approved student access and display of previously saved academic details.

## New applications

New document uploads and submissions are paused until their replacement workflow is chosen and implemented. The onboarding page allows personal-detail validation, then explains this boundary. Those entries are not persisted. The API also rejects the former processing/submission actions, so bypassing the UI cannot create a false screening or application result.

Manual administrator review can be introduced without automatic extraction, but it needs a reviewed, transactional submission function and corresponding frontend/API work. It must not mark an old screening record as passed to bypass the former requirement.

## Database preservation

The two SQL migrations in `supabase/migrations/` are applied history. They and the original SQL reference are retained unchanged, including legacy screening-related objects. Existing documents, applications, and review snapshots are not deleted. This cleanup performs no remote SQL and no schema reset.

Before replacing new-application submission, inspect the authorized database, prepare a forward migration, and obtain approval before applying it. Do not edit previously applied migrations or test with production records.

## Configuration

Only the frontend-safe Supabase URL/key and server-only Supabase URL/key are needed; see the README. The server key must never be sent to the browser. Local environment values are not included in the repository and no example environment file should be created.

The server and client continue to fail closed on missing credentials, invalid sessions, or failed status lookups. Existing records can contain original document data from earlier submissions; that data is preserved for review, not reprocessed.
