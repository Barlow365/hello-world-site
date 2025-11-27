/*
	script.js — polished UX for The Grid landing
	- Smooth scroll for internal anchors
	- Lead form client validation + mailto submission
	- Logo verification / fallback behavior
	- Section subtle reveal using IntersectionObserver
*/

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function setYear() {
	const el = document.getElementById('year');
	if (el) el.textContent = new Date().getFullYear();
}

/* ---------- smooth scroll ---------- */
function initSmoothScroll() {
	document.addEventListener('click', (e) => {
		const a = e.target.closest('a[href^="#"]');
		if (!a) return;
		const href = a.getAttribute('href');
		if (!href || href === '#') return;
		const target = document.querySelector(href);
		if (target) {
			e.preventDefault();
			target.scrollIntoView({ behavior: 'smooth', block: 'start' });
			// improve keyboard focus after scroll
			target.setAttribute('tabindex', '-1');
			target.focus({ preventScroll: true });
			window.setTimeout(() => target.removeAttribute('tabindex'), 1000);
		}
	});
}

/* ------------------------ responsive nav ------------------------ */
function initMobileNav() {
	const toggle = document.getElementById('nav-toggle');
	const nav = document.getElementById('primary-nav');
	if (!toggle || !nav) return;

	function setOpen(open) {
		nav.classList.toggle('open', open);
		toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
		// trap focus isn't necessary for tiny menus; leave simple
	}

	toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));

	// close menu when a link is activated
	nav.addEventListener('click', (e) => {
		const a = e.target.closest('a[href^="#"]');
		if (!a) return;
		// if small screen, close menu
		if (window.matchMedia('(max-width: 767px)').matches) setOpen(false);
	});

	// close when resizing large
	window.addEventListener('resize', () => {
		if (window.matchMedia('(min-width:768px)').matches) setOpen(false);
	});
}

/* ---------- section animations (small) ---------- */
function initSectionAnimations() {
	const sections = $$('.section, .hero');
	if (!('IntersectionObserver' in window)) return;
	const obs = new IntersectionObserver((entries) => {
		for (const e of entries) {
			if (e.isIntersecting) e.target.classList.add('in-view');
		}
	}, { threshold: 0.12 });
	sections.forEach(s => obs.observe(s));
}

/* ---------- form helpers ---------- */
let form, submitBtn, formMessage;

function collectLeadData(formEl) {
	return {
		name: (formEl.querySelector('#name')?.value || '').trim(),
		email: (formEl.querySelector('#email')?.value || '').trim(),
		role: (formEl.querySelector('#role')?.value || '').trim(),
		org: (formEl.querySelector('#org')?.value || '').trim(),
		usecase: (formEl.querySelector('#usecase')?.value || '').trim(),
		timeline: (formEl.querySelector('#timeline')?.value || '').trim(),
		consent: !!formEl.querySelector('#consent')?.checked,
	};
}

function validateLeadData(data) {
	const errors = {};
	if (!data.name) errors.name = 'Please enter your full name.';
	if (!data.email) errors.email = 'Please enter a work email.';
	else {
		const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!re.test(data.email)) errors.email = 'Please enter a valid email address.';
	}
	if (!data.usecase) errors.usecase = 'Tell us briefly what you want to build on The Grid.';
	if (!data.consent) errors.consent = 'You must allow us to contact you to submit.';

	return { valid: Object.keys(errors).length === 0, errors };
}

function showFieldErrors(formEl, errors) {
	['name','email','usecase','consent'].forEach((id) => {
		const input = formEl.querySelector('#' + id);
		if (!input) return;
		let el = formEl.querySelector('#err-' + id);
		if (!el) {
			el = document.createElement('div');
			el.className = 'field-error';
			el.id = 'err-' + id;
			el.setAttribute('role','alert');
			el.style.color = 'var(--danger)';
			el.style.fontSize = '13px';
			el.style.marginTop = '6px';
			input.insertAdjacentElement('afterend', el);
		}
		if (errors[id]) {
			el.textContent = errors[id];
			input.setAttribute('aria-invalid', 'true');
			input.setAttribute('aria-describedby', el.id);
		} else {
			el.textContent = '';
			input.removeAttribute('aria-invalid');
			input.removeAttribute('aria-describedby');
		}
	});
}

function buildMailtoUrl(data) {
	const to = 'info@pressmedia.haus';
	const subject = encodeURIComponent(`The Grid – Early Access Request (${data.name})`);
	const lines = [
		'Early access request for The Grid',
		'',
		`Name: ${data.name}`,
		`Email: ${data.email}`,
		data.role ? `Role: ${data.role}` : '',
		data.org ? `Company / Project: ${data.org}` : '',
		data.timeline ? `Timeline: ${data.timeline}` : '',
		'',
		'What they want to build on The Grid:',
		data.usecase,
		'',
		'---',
		'Submitted via payprofitlearn.com — The Grid early access form.'
	].filter(Boolean);

	const body = encodeURIComponent(lines.join('\n'));
	return `mailto:${to}?subject=${subject}&body=${body}`;
}

function copyToClipboard(text) {
	if (!navigator.clipboard) {
		// fallback: create a temporary textarea
		const ta = document.createElement('textarea');
		ta.value = text;
		ta.style.position = 'fixed'; ta.style.left = '-9999px';
		document.body.appendChild(ta);
		ta.focus(); ta.select();
		try { document.execCommand('copy'); } catch (e) { /* ignore */ }
		ta.remove();
		return Promise.resolve();
	}
	return navigator.clipboard.writeText(text).catch(() => {});
}

function submitLeadViaMailto(data) {
	// Opens the user's email client with prefilled subject+body
	const url = buildMailtoUrl(data);

	// Try to open using window.open (popups may be blocked and return null)
	let opened = null;
	try { opened = window.open(url); } catch (e) { opened = null; }

	// If window.open returned null, try using a programmatic anchor click as a fallback.
	if (!opened) {
		const a = document.createElement('a');
		a.href = url; a.target = '_self'; a.rel = 'noopener';
		a.style.display = 'none';
		document.body.appendChild(a);
		try { a.click(); opened = true; } catch (e) { opened = null; }
		a.remove();
	}

	// Show the modal with helpful fallbacks (preview + copy link) — include details so users can act.
	if (typeof showMailtoModal === 'function') {
		// give the browser a small moment to try opening the mail client
		window.setTimeout(() => showMailtoModal({ data, url, opened: !!opened }), 350);
	}

	return !!opened;
}

function submitLeadToBackend(data) {
	// stub for future backend integration — currently mailto-only
	// later: return fetch('/api/leads', { method:'POST', body: JSON.stringify(data) })
	// keep the same shape so swapping is simple
	return Promise.resolve({ ok: true });
}

async function handleLeadFormSubmit(e) {
	e.preventDefault();
	if (!form) return;
	const data = collectLeadData(form);
	const validation = validateLeadData(data);

	// clear previous messages and inline errors
	formMessage.textContent = '';
	showFieldErrors(form, {});

	if (!validation.valid) {
		showFieldErrors(form, validation.errors);
		formMessage.textContent = 'Please complete required fields and confirm consent.';
		formMessage.className = 'form-message error';
		console.warn('Lead form validation failed', validation.errors);
		return;
	}

	submitBtn.disabled = true; submitBtn.setAttribute('aria-busy','true');
	formMessage.textContent = 'Opening your email application with this request...';
	formMessage.className = 'form-message';

	try {
		// open the user's mail client with encoded content
		const opened = submitLeadViaMailto(data);

		// show confirmation text in page — when opened is false we show an actionable fallback
		if (opened) {
			formMessage.textContent = 'We opened your email app — please press send to complete your request.';
			formMessage.className = 'form-message success';
		} else {
			formMessage.textContent = 'Your mail client did not open automatically — use the copy or "Open in mail client" options in the dialog.';
			formMessage.className = 'form-message error';
		}

	} catch (err) {
		console.error('Lead submit error', err);
		formMessage.textContent = 'Unable to open your email app. Please send a note to info@pressmedia.haus or copy the message shown in the dialog.';
		formMessage.className = 'form-message error';
	} finally {
		submitBtn.disabled = false; submitBtn.removeAttribute('aria-busy');
	}
}

/* ---------- logo verification (helpful) ---------- */
function verifyLogo() {
	const logos = Array.from(document.querySelectorAll('#brand-logo, #hero-logo, #footer-logo'));
	if (!logos.length) return;

	logos.forEach((logo) => {
		// first, prefer a raster file in assets if it exists
		// check for ./assets/the-grid-logo.png and swap in to use the provided raster if present
		try {
			fetch('./assets/the-grid-logo.png', { method: 'HEAD' }).then((resp) => {
				if (resp && resp.ok) {
					// swap header/footer logos to the PNG source (user provided)
					logos.forEach(l => { if (l.id !== 'hero-logo') l.src = './assets/the-grid-logo.png'; });
					// hide the textual wordmark in header when a full wordmark logo exists
					const brandText = document.querySelector('.brand-text');
					if (brandText) brandText.style.display = 'none';
				}
			}).catch(() => {/* not found — ignore */});
		} catch (err) {
			// fetch not supported — ignore
		}

		// then try data-fallback-src if present when original fails
		logo.addEventListener('error', () => {
			const fallback = logo.getAttribute('data-fallback-src');
			if (fallback && !logo.dataset.triedFallback) {
				logo.dataset.triedFallback = '1';
				logo.src = fallback;
				return;
			}

			const rootFallback = logo.getAttribute('data-fallback-root');
			if (rootFallback && !logo.dataset.triedRoot) {
				logo.dataset.triedRoot = '1';
				logo.src = rootFallback;
				return;
			}

			// all fallbacks exhausted — hide image gracefully
			logo.style.display = 'none';
			const brandText = document.querySelector('.brand-text');
			if (brandText) brandText.style.opacity = 1;
			console.error('[The Grid] Logo failed to load — check assets/the-grid-logo.svg or paths.');
		});

		// on successful load, reduce wordmark prominence so the mark leads visually
		logo.addEventListener('load', () => {
			const brandText = document.querySelector('.brand-text');
			if (brandText) brandText.style.opacity = 0.92;
		});
	});
}

/* ---------- init ---------- */

/* ------------------------ mailto modal ------------------------ */
function showMailtoModal() {
	// legacy compatibility: accept optional options object
	const args = arguments[0] || {};
	const modal = document.getElementById('mailto-modal');
	if (!modal) return;

	// populate preview and link if available
	const preview = document.getElementById('mailto-preview');
	const openLink = document.getElementById('modal-open-link');
	const copyBtn = document.getElementById('modal-copy');

	if (args.data) {
		const readable = [
			'To: info@pressmedia.haus',
			'',
			`Name: ${args.data.name || ''}`,
			`Email: ${args.data.email || ''}`,
			args.data.role ? `Role: ${args.data.role}` : '',
			args.data.org ? `Company / Project: ${args.data.org}` : '',
			args.data.timeline ? `Timeline: ${args.data.timeline}` : '',
			'',
			'What they want to build on The Grid:',
			args.data.usecase || '',
			'',
			'---',
			'Submitted via payprofitlearn.com — The Grid early access form.'
		].filter(Boolean).join('\n');

		if (preview) preview.textContent = readable;
	}

	if (openLink && args.url) {
		openLink.href = args.url;
	}

	// set a short hint for users if the browser likely couldn't open a mail client
	const hintTitle = document.getElementById('mailto-modal-title');
	if (hintTitle) {
		if (args.opened === false) hintTitle.textContent = 'Mail client didn\'t open — try one of these options';
		else hintTitle.textContent = 'Email composer opened';
	}

	// show modal
	modal.hidden = false;
	modal.classList.add('open');

	// focus first actionable control
	const sentBtn = document.getElementById('modal-sent');
	if (sentBtn) sentBtn.focus({ preventScroll: true });
}

function hideMailtoModal() {
	const modal = document.getElementById('mailto-modal');
	if (!modal) return;
	modal.hidden = true;
	modal.classList.remove('open');
	// return focus to the submit button
	if (submitBtn) submitBtn.focus({ preventScroll: true });
}

function initModalBehavior() {
	const modal = document.getElementById('mailto-modal');
	if (!modal) return;
	const close = document.getElementById('modal-close');
	const sent = document.getElementById('modal-sent');
	const notSent = document.getElementById('modal-not-sent');

	close?.addEventListener('click', hideMailtoModal);
	sent?.addEventListener('click', () => {
		hideMailtoModal();
		// user confirms — optionally reset the form
		try { form?.reset(); } catch (e) {}
		if (formMessage) { formMessage.textContent = 'Thanks — we received your early request. We’ll follow up via email.'; formMessage.className = 'form-message success'; }
	});
	notSent?.addEventListener('click', () => {
		// user indicates they couldn't send — keep the modal, offer copy. We'll show a message and keep the modal open
		if (formMessage) { formMessage.textContent = 'Try copying the message below or click "Open in mail client".'; formMessage.className = 'form-message error'; }
		// focus copy button
		const copyBtn = document.getElementById('modal-copy');
		if (copyBtn) copyBtn.focus({ preventScroll: true });
	});

	// copy mail body to clipboard
	const copyBtn = document.getElementById('modal-copy');
	copyBtn?.addEventListener('click', (e) => {
		const preview = document.getElementById('mailto-preview');
		if (!preview) return;
		const text = preview.textContent || preview.innerText || '';
		copyToClipboard(text).then(() => {
			if (formMessage) { formMessage.textContent = 'Message copied to clipboard — paste it into an email to info@pressmedia.haus.'; formMessage.className = 'form-message success'; }
		}).catch(() => {
			if (formMessage) { formMessage.textContent = 'Unable to copy automatically. You can select the text below and copy it manually.'; formMessage.className = 'form-message error'; }
		});
	});

	// open mailto link in new tab/window when user clicks the explicit link
	const openLink = document.getElementById('modal-open-link');
	openLink?.addEventListener('click', (e) => {
		// allow the default behavior — but ensure the user sees an explanatory message
		if (formMessage) { formMessage.textContent = 'If your mail client opens, press Send to complete your request.'; formMessage.className = 'form-message'; }
		// hide modal after a moment so user doesn't lose context
		window.setTimeout(() => hideMailtoModal(), 700);
	});

	// close modal on ESC
	window.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideMailtoModal(); });
}

function initLeadForm() {
	form = document.getElementById('early-access-form');
	submitBtn = document.getElementById('submit-btn');
	formMessage = document.getElementById('form-message');

	if (!form) return;
	form.addEventListener('submit', handleLeadFormSubmit);
}

document.addEventListener('DOMContentLoaded', () => {
	setYear();
	initSmoothScroll();
	initMobileNav();
	initLeadForm();
	initModalBehavior();
	initSectionAnimations();
	verifyLogo();
});
