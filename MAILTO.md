# Mailto-only early-access flow — developer notes

This repository intentionally uses a client-only, mailto-based early access flow (no third-party form service or server required).

Why mailto?
- Keeps the repo static and simple (suitable for GitHub Pages).
- Requests are sent to `info@pressmedia.haus` and are handled via email rather than a remote API.

How it works (quick overview)
- `script.js` builds a mailto URL using `buildMailtoUrl(data)` and attempts to open the default mail client.
- The submit flow uses multiple strategies to improve reliability:
  1. Try `window.open(mailtoUrl)` (may succeed if OS/browser have a handler)
  2. If blocked, create an invisible anchor and `.click()` it as a fallback
  3. Regardless of success, a modal (`#mailto-modal`) gives a readable preview of the generated message and offers two helpful actions:
     - `Copy message` — copies the email body to the clipboard.
     - `Open in mail client` — an explicit link to open the mailto URL.

Accessibility & UX notes
- Modal contains an accessible title (`aria-labelledby`) and uses `aria-live` for `#form-message` updates.
- Inline errors are presented next to inputs with `role="alert"` to be read by assistive technologies.

Testing locally
1. Open `index.html` in your browser (or host with a local static server).
2. Fill in the early-access form and click the submit button.
3. If your environment has a default mail client set (e.g., Outlook, Apple Mail), the client should open with a pre-filled message. Press Send to complete.
4. If nothing opens (web-only environments or blocked popups), the modal will show the full message and you can:
   - Click `Copy message` and paste into an email to `info@pressmedia.haus`, or
   - Click `Open in mail client` (may prompt for the default mail app) to attempt again.

Edge cases & developer maintenance
- Browsers without a default mail handler or restrictive popup blockers may still prevent the mail client opening — the modal fallback is the intended UX.
- For an automated server-side capture you can swap `submitLeadViaMailto` with a backend POST to a stable endpoint. `submitLeadToBackend` is a small stub in `script.js` to help integrate later.

Where to look in code
- `index.html` — modal, form markup and ids used by `script.js`.
- `script.js` — `collectLeadData`, `validateLeadData`, `buildMailtoUrl`, `submitLeadViaMailto`, modal handling.

If you'd like I can add an automated QA checklist or a small e2e test harness (Puppeteer/Playwright) to confirm behavior across browsers.
