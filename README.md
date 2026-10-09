# EXS workout assessment prototype

Local build for EXS215 / EXS217. No deployment or real email delivery.

## Schedule loaded October 9, 2026
The two supplied screenshots were transcribed into schedule-data.js, including teaching, front desk, support, participant assignments, and EXS217 equipment. Only first names are included. No grades are supplied.

EXS215: October 20 and October 27. The former October 27 10:30–11:15 DemoL/DemoM teaching session is deferred with no replacement date. Associated DemoA/DemoB front desk and DemoE/DemoF support are awaiting an alternate opportunity. Participation in that removed slot is not marked missing or incomplete. DemoL/DemoM's own October 20 support and October 27 front desk remain scheduled as shown. This interpretation is explicit so Michelle can revise it if intended otherwise.

EXS217: October 22 and October 29, all six sessions active. Equipment assignments match the screenshot.

## Current behavior
- Course and student selectors retrieve assessments across dates.
- Shared assessments use a course/team/session identity; individual and role assessments use course/student/session identities.
- Teaching score is the mean of four shared and six individual 0–4 criteria, only when all are rated.
- Professional Practice is the mean of front desk and support. Deferred roles prevent a final score. Numeric zero is distinct from unscored.
- Participation follows actual scheduled participant assignments and is completion only, outside numeric scoring.
- Comment choices, editable wording and free notes compile into a printable report with criterion bars and participant averages/counts.
- Participant and observer sample submissions are attached to the student's teaching session. Forms are unavailable for the deferred session.
- Sample check-in allows only example.com addresses, separate invitation consent and no duplicate address per session. Ending an active session prepares invitation previews, never sends email. Delay/cancel removes previews; the deferred session cannot collect check-ins or prepare invitations.
- Browser-local progress/export/import/clear only. The new schedule uses a separate browser-storage key from earlier fictional samples, which are not assigned to real first names. Import requires the current schedule schema.

## Check
Run `node check-workflow.cjs` for schedule, separation, score, deferred-role and check-in tests. JavaScript syntax checked. Browser rendering and hosted integration remain unverified.

## Remaining before operational use
Editable schedule/roster and absences; later role opportunities and reassignment; protected account access and temporary cross-device records; real evaluation links and server-side email delivery; two-observer assignment enforcement; full participant/team evaluation; polished report release/versioning; semester deletion workflow. Use test ratings only until protection and hosted flows are verified. Canvas remains the official grade destination.

## Evaluation/report increment
- One participant form covers every instructor in the teaching team plus three whole-workout items and optional team feedback. Individual and team answered-item means remain separate. Missing/N/A items do not become zero.
- Numerical ratings always contribute when valid (1–5). Sharing permission gates written comments. Instructor selections and edited/redacted wording are per student; team comments can be included independently in each student's report.
- Observer names come from assigned support: two members auto-assigned; a three-person team requires instructor selection of two. Each observer submits one form covering all teaching students. A repeat submission by that observer replaces their session's earlier rows and resets inclusion choices. Local identity selection is not authentication.
- Reports use a compact score table with criterion bars, grouped instructor feedback, instructor-entered priorities, dated role/participation evidence and separate participant/team/observer sections. Browser Print / Save PDF remains the output mechanism. The print action stores the HTML preview as a dated version snapshot, even if printing is canceled; it does not certify report release or create a PDF in storage.
- Visual PDF/browser QA remains pending because no browser executable is available in this local runtime. No real emails, secured public evaluation routes or real scores were created. Earlier checklist references to full team evaluation and observer selection are now implemented locally; secure hosting, live delivery, schedule editing, absence handling and semester deletion remain outstanding.

## Simplified front desk check-in
Open checkin.html from the assessment footer. Front desk chooses the course and workout team; participants enter name and email and may request an evaluation invitation. Team/date/time remain visible. Successful check-in clears personal fields and retains the team selection. Duplicate addresses per workout, deferred/completed/canceled workouts, invalid test addresses and failed browser saving are handled. No client list or grading controls appear on this separate screen. It remains a local test interface, not an authenticated public endpoint. Use fictional names and @example.com addresses only. Same-origin tabs share browser records; cross-device persistence and account access are unfinished.

Print layout has US Letter margins, fixed table columns and wrapping for long text. Browser-generated PDF visual verification remains pending; do not describe it as visually verified.

## Public source privacy
This repository uses demonstration student names. Do not commit real rosters, assessment records, participant contact details, report snapshots, secrets or credentials. The public preview is test-only until protected server storage, authorization and email delivery are implemented.
