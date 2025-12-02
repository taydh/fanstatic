{
	fanstatic.assign({
		style_base_url: null,
	});

	Object.assign(fanstatic, {
		applyLess: function(url = fanstatic.settings.library_less_url) {
			if (url) {
				return fanstatic.insertScripts([ url ]);
			}

			return false;
		},
		applyTheme: function(style = fanstatic.settings.theme_style, framework = fanstatic.settings.theme_framework, opt = { mode: fanstatic.settings.theme_mode, includeUtility: null }) {
			const mode = opt.mode || fanstatic.settings.theme_mode || 'css';
			const includeUtility = opt.includeUtility !== null ? opt.includeUtility : false;
			const styleBaseUrl = fanstatic.withTrailingSlash(fanstatic.settings.style_base_url || fanstatic.getVersionedBaseUrl());

			// sanitize values
			style = fanstatic.removePathCharacters(style);
			framework = fanstatic.removePathCharacters(framework);

			console.log('🖼️ Style theme applied: ' + style + ' (' + framework + '), mode: ' + mode);

			const utilsBaseUrl = `${styleBaseUrl}utils/`;
			const themeBaseUrl = `${styleBaseUrl}themes/`;
			const themeFrameworkBaseUrl = fanstatic.settings.theme_framework_base_url || `${themeBaseUrl}${framework}/`;
			const themeStyleBaseUrl = fanstatic.settings.theme_style_base_url || `${themeBaseUrl}${framework}/${style}/`;

			const scriptsUrls = [
				`${themeBaseUrl}theme-generic.js` + '?' + fanstatic.trail(),
				`${themeFrameworkBaseUrl}theme-framework.js` + '?' + fanstatic.trail(),
				`${themeStyleBaseUrl}theme-style.js` + '?' + fanstatic.trail(),
			];

			const prom1 = ('less' == mode) 
				? fanstatic.insertLess([
					includeUtility ? `${utilsBaseUrl}_compiler.less?${fanstatic.trail()}` : null,
					`${themeStyleBaseUrl}_compiler.less?${fanstatic.trail()}`,
					]) 
				: (('css-dev' == mode)
					? fanstatic.insertStyles([
						includeUtility ? `${utilsBaseUrl}_base.css?${fanstatic.trail()}` : null,
						`${themeBaseUrl}_global.css?${fanstatic.trail()}`,
						`${themeFrameworkBaseUrl}_framework.css?${fanstatic.trail()}`,
						`${themeStyleBaseUrl}_base.css?${fanstatic.trail()}`
					])
					: fanstatic.insertStyles([
						includeUtility ? `${utilsBaseUrl}utils.css?${fanstatic.trail()}` : null,
						`${themeStyleBaseUrl}theme.css?${fanstatic.trail()}`
					]));
			
			const prom2 = fanstatic.insertScripts(scriptsUrls);

			return Promise.all([prom1, prom2]);
		},
	})
		
	window.dispatchEvent(new CustomEvent('fanstatic.style.load'));
}
