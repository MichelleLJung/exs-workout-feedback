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

## Instructor online saving (activation pending)
An instructor-only records endpoint and sign-in panel are implemented. They deny access unless EXS_CLOUD_ENABLED=true, EXS_ADMIN_EMAIL is configured, Identity verifies a confirmed user with that exact email, and storage is available. Reads are not cached. Writes require the same origin, valid JSON/schema, a payload under 2 MB and a matching stored version. Conflicts preserve the current work and require export/reload; they do not silently overwrite. Browser test data is not automatically uploaded. Select Load online records after signing in.

This is not activated or verified with a real instructor account. Identity configuration/account setup is still needed. Public check-in currently remains a browser-local test flow and does not write to these instructor records. Evaluation links, email, protected roster loading, report-release workflow and semester closeout still require implementation. Do not collect real participant information or grades yet.


## Licensing and creator credit

Created by Michelle L. Jung. © 2026 Michelle L. Jung.
Original instructional content: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Original code: MIT; see [LICENSE-CODE.txt](LICENSE-CODE.txt). See [LICENSE](LICENSE) for scope, exclusions, and educational disclaimer. Third-party materials and private/user records are excluded from this grant.

## Shared test workflow

The private preview now stores demo participant check-ins and full-team evaluations in Netlify Blobs. Front desk chooses the workout team; the participant enters a fictional name and an `@example.com` address. Check-in metadata shown publicly contains only the demo workout team, date, time and status. Participant records and feedback imports require the approved instructor account.

After loading online instructor records, select **Refresh participant feedback** to import shared check-ins and responses. Existing edited comments and report selections are preserved. Marking a workout Completed closes check-in and prepares evaluation previews for consenting participants; refresh to retrieve preview links. One evaluation covers every teaching team member and separate whole-workout items. Comments start excluded from reports and require sharing consent and instructor selection.

`npm run check` validates grading/schedule behavior, protected record persistence, privacy, consent, closed sessions and concurrent duplicate submissions. `npm run build` bundles instructor authentication and copies the public form assets. A populated five-page report was rendered and visually reviewed with WeasyPrint; browser Save as PDF pagination may differ.

This remains a demo-only preview. Real participant collection, automated email delivery and the public launch are unfinished. No participant messages are sent.


## Short participant evaluation and feedback inbox

The hosted participant form now asks only three whole-workout questions and one optional comment. It does not require participants to identify individual students. This supersedes the earlier full-team individual participant form; earlier submissions remain readable. Instructor grading remains individual and unchanged. Loading online records also refreshes shared feedback and opens Participant feedback, which lists received evaluations across both courses. Existing edited wording and report selections are retained. Workout schedule includes named check-in rosters. Public check-in/evaluation pages no longer repeat creator/licensing blocks; the instructor home links to the licensing page.


## Prepared SMTP invitation delivery (not activated)

`workout-invitations.mjs` is a scheduled worker for optional evaluation invitations. It uses the clinic scheduler's Nodemailer/SMTP pattern. By default it exits without sending or changing data. It requires both `EMAIL_MODE=live` and `EXS_TEST_MODE=false` plus `SMTP_HOST`, `SMTP_PORT` (465 or 587), `SMTP_USER`, `SMTP_PASS`, and `EMAIL_FROM`. Keep credentials in Netlify Functions environment settings; never source code. TLS is required.

Invitations are eligible only when the instructor marks the workout Completed, the participant requested an invitation, the evaluation is not already submitted, and the check-in is explicitly marked `test:false`. Existing demo entries and example.com/org/net recipients are never emailed. The current check-in service remains demo-only, so enabling the worker alone cannot activate real collection. Real-mode check-in/roster setup and a complete backed-up demo reset remain separate launch tasks. The site stays private until launch.

The worker claims each delivery atomically and does not automatically retry an ambiguous SMTP failure; instructor review is required to avoid duplicate invitations. A sending claim interrupted by a process crash also requires review. At most three messages are attempted per run. Inbox responses include only non-secret connection status, and prepared previews show the exact date/time and evaluation invitation wording. Instructor cloud mode disables the browser-only Clear sample data control so it cannot wipe the shared grading record accidentally.

`npm run check` additionally validates preview side effects, consent, completed/canceled sessions, demo exclusion, concurrent delivery claims, duplicate prevention, ambiguous failures and invitation wording. SMTP connectivity and actual delivery have not been tested; this Netlify project currently has no mail credentials. No participant emails were sent.


## Protected email connection check

After loading online instructor records, **Check email connection** verifies the configured SMTP account without sending a message. Only the verified instructor can use the same-origin endpoint. Passwords and provider error details are never returned. The sender display name is MCC Workout Feedback. Participant sending remains disabled until the separate launch gates and real-data workflow are deliberately enabled.
