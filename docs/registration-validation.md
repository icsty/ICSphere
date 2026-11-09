# Registration input validation

Student email addresses follow the supplied `202X-XXXXXX@rtu.edu.ph` pattern, where each X is a digit. Email casing and surrounding whitespace are normalized. Student numbers must match the authenticated email prefix. This restriction applies to student registration, not administrator identities.

Names use required last/first names and optional middle name/suffix. Name parts allow 80 characters; suffix allows 20. Normalization preserves legitimate accents, spaces, initials, apostrophes, commas, and hyphens while rejecting markup and hidden controls. Errors use `aria-invalid` and explanatory text.

Academic validation remains available for saved academic data and future submission work. It checks bounded text fields, subject rows, numeric units, and unit totals. It does not establish enrollment or eligibility. BSINFOTECH remains the program identifier; there is no automatic program-field extraction or screening helper.

Identity checks are not account approval. The API verifies sessions against Supabase Auth and administrator roles against persisted account state. Student access requires an approved application and active account. New applications remain paused until document submission is replaced; no form or client boolean can bypass this boundary.
