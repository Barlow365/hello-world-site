// ---------------------------
// Global UI helpers
// ---------------------------
const $ = (sel) => document.querySelector(sel);

function setYear() {
	const yearEl = document.getElementById('year');
	if (yearEl) yearEl.textContent = new Date().getFullYear();
}

// smooth scrolling for same-page anchors
function initSmoothScroll() {
	document.addEventListener('click', (e) => {
		const anchor = e.target.closest('a[href^="#"]');
		if (!anchor) return;
		const href = anchor.getAttribute('href');
		if (!href || href === '#') return;
		const target = document.querySelector(href);
		if (target) {
			e.preventDefault();
			target.scrollIntoView({ behavior: 'smooth', block: 'start' });
			// update focus for accessibility
			target.setAttribute('tabindex', '-1');
			target.focus({ preventScroll: true });
			window.setTimeout(() => target.removeAttribute('tabindex'), 1200);
		}
	});
}

// ---------------------------
// Formspree-powered form
// ---------------------------
// NOTE: Replace `your-form-id` with your actual Formspree ID in index.html
const form = document.getElementById('lead-form');
const submitBtn = document.getElementById('submit-btn');
const statusEl = document.getElementById('form-status');

async function submitForm(e) {
	e.preventDefault();

	// Collect form values
	const data = {
		name: form.name.value.trim(),
		email: form.email.value.trim(),
		role: form.role.value.trim(),
		org: form.org.value.trim(),
		usecase: form.usecase.value.trim(),
		timeline: form.timeline.value || '',
	};

	const consent = form.consent && form.consent.checked;

	// Basic validation
	if (!data.name || !data.email || !data.usecase || !consent) {
		statusEl.textContent = 'Please complete required fields and confirm consent.';
		statusEl.className = 'form-status status-error';
		console.warn('form validation failed', data);
		return;
	}

	// Disable UI
	submitBtn.disabled = true;
	submitBtn.setAttribute('aria-busy', 'true');
	submitBtn.style.opacity = 0.8;
	statusEl.textContent = 'Sending…';
	statusEl.className = 'form-status';

	const endpoint = form.getAttribute('action') || 'https://formspree.io/f/your-form-id';

	try {
		const resp = await fetch(endpoint, {
			method: 'POST',
			headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});

		if (!resp.ok) {
			const json = await resp.json().catch(()=>null);
			const message = json && json.error ? json.error : `Server returned ${resp.status}`;
			throw new Error(message);
		}

		// success
		statusEl.textContent = 'Thanks — your request has been received. We will contact you soon.';
		statusEl.className = 'form-status status-success';
		console.log('Formspree submit success', data);
		form.reset();
	} catch (err) {
		console.error('Form submission error', err);
		statusEl.textContent = 'Sorry — something went wrong. Please try again or contact info@pressmedia.haus.';
		statusEl.className = 'form-status status-error';
	} finally {
		submitBtn.removeAttribute('aria-busy');
		submitBtn.disabled = false;
		submitBtn.style.opacity = 1;
	}
}

// quick check: if target logo file doesn't exist we log a helpful message (file may be missing in project)
function verifyLogo() {
	const logo = document.querySelector('#hero-logo') || document.querySelector('#brand-logo');
	if (!logo) return;
	// image element exists — check naturalWidth once loaded
	if (logo.complete) {
		if (!logo.naturalWidth) console.warn('Logo image appears missing or invalid: ./the-grid-logo.png — add the file to project root or update the path in index.html');
	} else {
		logo.addEventListener('error', () => console.warn('Logo image failed to load: ./the-grid-logo.png — add file or update path'));
	}
}

// init when DOM ready
document.addEventListener('DOMContentLoaded', () => {
	setYear();
	initSmoothScroll();
	verifyLogo();
	if (form) form.addEventListener('submit', submitForm);
});
