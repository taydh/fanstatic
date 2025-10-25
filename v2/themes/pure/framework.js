{
	if (!fanstatic.settings.class_fix) fanstatic.settings.class_fix = {};

	Object.assign(fanstatic.settings.class_fix, {
		'[data-role="container"]': ['theme-container',''],
		'[data-design="unit"][data-scope="section.containerized-hero"]': ['theme-hero-unit',''],
	});
}
