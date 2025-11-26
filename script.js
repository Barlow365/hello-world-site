/*
	script.js — handles:
	- smooth page scrolling
	- lead form collection, validation, and mailto-based submission
	- accessible inline error messages + aria-live summary
	- a small init for section animations (IntersectionObserver)
*/

/* ---------- helpers ---------- */
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

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
			// give keyboard focus for accessibility
			target.setAttribute('tabindex', '-1');
			target.focus({ preventScroll: true });
			window.setTimeout(() => target.removeAttribute('tabindex'), 1200);
		}
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
	}, { threshold: 0.13 });
	sections.forEach(s => obs.observe(s));
}

/* ---------- form helpers ---------- */
const form = document.getElementById('lead-form');
const submitBtn = document.getElementById('submit-btn');
const formMessage = document.getElementById('form-message');

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
		// simple email regex
		const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!re.test(data.email)) errors.email = 'Please enter a valid email address.';
	}
	if (!data.usecase) errors.usecase = 'Tell us what you want to build on The Grid.';
	if (!data.consent) errors.consent = 'You must allow us to contact you to submit.';

	const valid = Object.keys(errors).length === 0;
	return { valid, errors };
}

function showFieldErrors(formEl, errors) {
	// clear existing error nodes
	// for each field, inject or update an error element
	['name','email','usecase','consent'].forEach((id) => {
		const input = formEl.querySelector('#' + id);
		if (!input) return;
		let el = formEl.querySelector('#err-' + id);
		if (!el) {
			el = document.createElement('div');
			el.className = 'field-error';
			el.id = 'err-' + id;
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
		'Early access request for The Grid:',
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
		'Submitted via payprofitlearn.com lead form.'
	].filter(Boolean);

	const body = encodeURIComponent(lines.join('\n'));
	return `mailto:${to}?subject=${subject}&body=${body}`;
}

function submitLeadViaMailto(data) {
	// Opens the user's email client with prefilled subject+body
	const url = buildMailtoUrl(data);
	window.location.href = url;
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

	// clear previous messages
	formMessage.textContent = '';
	showFieldErrors(form, {});

	if (!validation.valid) {
		showFieldErrors(form, validation.errors);
		formMessage.textContent = 'Please complete required fields and confirm consent.';
		formMessage.className = 'form-message status-error';
		console.warn('Lead form validation failed', validation.errors);
		return;
	}

	// disable UI while processing
	submitBtn.disabled = true; submitBtn.setAttribute('aria-busy','true');
	formMessage.textContent = 'Opening your email app — please press send to complete the request.';
	formMessage.className = 'form-message';

	try {
		// call the backend stub (keeps future swap simple)
		const resp = await submitLeadToBackend(data);
		console.log('submitLeadToBackend:', resp);

		// mailto client for now
		submitLeadViaMailto(data);

		// show success message after mailto opened
		formMessage.textContent = 'We opened your email app. Press send to complete your request.';
		formMessage.className = 'form-message status-success';

		// optionally reset
		// form.reset();
	} catch (err) {
		console.error('Lead submit error', err);
		formMessage.textContent = 'Sorry — something went wrong. Please try again or email info@pressmedia.haus.';
		formMessage.className = 'form-message status-error';
	} finally {
		submitBtn.disabled = false; submitBtn.removeAttribute('aria-busy');
	}
}

/* ---------- logo verification (helpful) ---------- */
function verifyLogo() {
	const logo = document.querySelector('#brand-logo') || document.querySelector('#hero-logo');
	if (!logo) return;
	if (logo.complete) {
		if (!logo.naturalWidth) console.warn('Logo missing or invalid at ./the-grid-logo.png — add a valid image or update the path.');
	} else {
		logo.addEventListener('error', () => console.warn('Logo failed to load: ./the-grid-logo.png — add or update the file.'));
	}
}

/* ---------- init ---------- */
function initLeadForm() {
	if (!form) return;
	form.addEventListener('submit', handleLeadFormSubmit);
}

document.addEventListener('DOMContentLoaded', () => {
	setYear();
	initSmoothScroll();
	initLeadForm();
	initSectionAnimations();
	verifyLogo();
});
