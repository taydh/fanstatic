window.addEventListener('DOMContentLoaded', async function() {
	await fanstatic.searchAndRunCommand(document.body);
	fanstatic.removeLocalizedTemplates();
});