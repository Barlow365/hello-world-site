// Set footer year
document.addEventListener("DOMContentLoaded", () => {
	const yearEl = document.getElementById("year");
	if (yearEl) {
		yearEl.textContent = new Date().getFullYear();
	}
});

// Lead form handler — builds an email to info@pressmedia.haus
const form = document.getElementById("lead-form");
const messageEl = document.getElementById("form-message");

if (form) {
	form.addEventListener("submit", (e) => {
		e.preventDefault();

		const name = form.name.value.trim();
		const email = form.email.value.trim();
		const role = form.role.value.trim();
		const org = form.org.value.trim();
		const usecase = form.usecase.value.trim();
		const timeline = form.timeline.value;
		const consent = document.getElementById("consent").checked;

		if (!name || !email || !usecase || !consent) {
			if (messageEl) {
				messageEl.textContent =
					"Please complete all required fields and confirm consent.";
				messageEl.classList.remove("success");
				messageEl.classList.add("error");
			}
			return;
		}

		const subject = encodeURIComponent(
			`The Grid – Early Access Request (${name})`
		);

		const bodyLines = [
			"New early access request for The Grid:",
			"",
			`Name: ${name}`,
			`Email: ${email}`,
			role ? `Role: ${role}` : "",
			org ? `Company / Project: ${org}` : "",
			timeline ? `Timeline: ${timeline}` : "",
			"",
			"What they want to build on-chain:",
			usecase,
			"",
			"---",
			"Submitted via payprofitlearn.com lead form."
		].filter(Boolean);

		const body = encodeURIComponent(bodyLines.join("\n"));

		const mailto = `mailto:info@pressmedia.haus?subject=${subject}&body=${body}`;

		// Open the user's email client
		window.location.href = mailto;

		if (messageEl) {
			messageEl.textContent =
				"Opening your email app. Please press send to complete your request.";
			messageEl.classList.remove("error");
			messageEl.classList.add("success");
		}

		form.reset();
	});
}
