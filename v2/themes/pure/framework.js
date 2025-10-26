{
	if (!fanstatic.settings.class_fix) fanstatic.settings.class_fix = {};

	Object.assign(fanstatic.settings.class_fix, {
		'[data-role="container"]': ['theme-container',''],
		'[data-design="unit"][data-scope="section.containerized-hero"]': ['theme-hero-unit',''],
		'[data-role="menu-list"][data-scope="navigation.simple"]': ['pure-menu',''],
		'[data-role="menu-list"][data-scope="navigation.simple"] > [data-role="menu-item"]': ['pure-menu-item',''],
		'[data-role="menu-list"][data-scope="navigation.simple"] > [data-role="menu-item"] > [data-role="menu-link"]': ['pure-menu-link',''],
	});
}
