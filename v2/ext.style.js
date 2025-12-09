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
		applyTheme: function(theme = fanstatic.settings.theme, framework = fanstatic.settings.theme_framework, opt = { mode: fanstatic.settings.theme_mode, includeUtility: null }) {
			const mode = opt.mode || fanstatic.settings.theme_mode || 'css';
			const includeUtility = opt.includeUtility !== null ? opt.includeUtility : false;
			const styleBaseUrl = fanstatic.withTrailingSlash(fanstatic.settings.style_base_url || fanstatic.getVersionedBaseUrl());

			// sanitize values
			theme = fanstatic.removePathCharacters(theme);
			framework = fanstatic.removePathCharacters(framework);

			console.log('🖼️ Style theme applied: ' + theme + ' (' + framework + '), mode: ' + mode);

			const utilsBaseUrl = `${styleBaseUrl}utils/`;
			const themeFrameworkBaseUrl = fanstatic.settings.theme_framework_base_url || `${styleBaseUrl}theme-framework-adapters/${framework}/`;
			const themeBaseUrl = fanstatic.settings.theme_base_url || `${styleBaseUrl}themes/${theme}/`;

			const scriptsUrls = [
				// `${styleBaseUrl}themes/theme-global-script.js` + '?' + fanstatic.trail(),
				`${themeBaseUrl}theme-script.js` + '?' + fanstatic.trail(),
				`${themeFrameworkBaseUrl}theme-adapter-script.js` + '?' + fanstatic.trail(),
			];

			const prom1 = ('less' == mode) 
				? fanstatic.insertLess([
					// includeUtility ? `${utilsBaseUrl}_compiler.less?${fanstatic.trail()}` : null,
					`${themeBaseUrl}less/_compiler.less?${fanstatic.trail()}`,
					`${themeFrameworkBaseUrl}less/_compiler.less?${fanstatic.trail()}`,
					]) 
				: (('css-dev' == mode)
					? fanstatic.insertStyles([
						includeUtility ? `${utilsBaseUrl}_base.css?${fanstatic.trail()}` : null,
						`${themeBaseUrl}_global.css?${fanstatic.trail()}`,
						`${themeFrameworkBaseUrl}_framework.css?${fanstatic.trail()}`,
						`${themeBaseUrl}_base.css?${fanstatic.trail()}`
					])
					: fanstatic.insertStyles([
						includeUtility ? `${utilsBaseUrl}utils.css?${fanstatic.trail()}` : null,
						`${themeBaseUrl}theme.css?${fanstatic.trail()}`
					]));

			const prom2 = fanstatic.insertScripts(scriptsUrls);
			const prom3 = ('less' == mode)
					? this.applyLess()
					: new Promise(rs => rs(null));

			return Promise.all([prom1, prom2, prom3]);
		},
	})
		
	window.dispatchEvent(new CustomEvent('fanstatic.style.load'));
}
