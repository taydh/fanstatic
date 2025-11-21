window.addEventListener('DOMContentLoaded', async function() {
	await fanstatic.searchAndRunCommand(document.body);
	document.querySelector('#' + fanstatic.settings.local_area_id)?.remove();
});