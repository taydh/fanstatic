(async () => {
	const settings = {};
	const config = await fanstatic.fetchJson('fanstatic_contentmanager_config.json');

	fanstatic.assign({
		base_url: config.fanstaticBaseUrl || fanstatic.settings.base_url,
		trail_span: config.fanstaticTrailSpan || fanstatic.settings.trail_span,
	})

	// document title
	document.title = config.siteTitle;
	
	const cmClassSrc = config.contentManagerClassSrc 
			|| 'https://fanstatic.annexdesk.com/v2/subsystem/content-manager/fanstatic-content-manager.js';

	await fanstatic.insertScripts([
		'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
		'https://cdn.jsdelivr.net/npm/mustache@4.2.0/mustache.min.js',
		cmClassSrc
	]);

	Object.assign(settings, config, {
		pages: await fanstatic.fetchJson(config.contentBaseUrl + '/pages.json'),
		authors: await fanstatic.fetchJson(config.contentBaseUrl + '/authors.json'),
		categories: await fanstatic.fetchJson(config.contentBaseUrl + '/categories.json'),
		posts: await fanstatic.parseCsv(config.contentBaseUrl + '/posts.csv', {
			download: true,
			header: true,
			skipEmptyLines: true,
		})
	});

	const cm = new Fanstatic_ContentManager(settings);

	const layoutController = await fanstatic.insert(document.body, config.designBaseUrl + '/body.htm', 
		{
			data: {
				config: config,
				slug: cm.resolveSlug(),
				contentManager: cm,
			}
		}
	);

	fanstatic.removeLocalizedTemplates();

	if (window.main) {
		window.main({
			config: config,
			controlManager: cm,
			layoutController: layoutController,
		});
	}
})();