{
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

			// sanitize values
			style = fanstatic.removePathCharacters(style);
			framework = fanstatic.removePathCharacters(framework);

			console.log('🖼️ Style theme applied: ' + style + ' (' + framework + '), mode: ' + mode);

			const utilsBaseUrl = `${fanstatic.settings.base_url}${fanstatic.settings.version}/utils/`;
			const themeBaseUrl = `${fanstatic.settings.base_url}${fanstatic.settings.version}/themes/`;
			const styleScriptUrl = `${themeBaseUrl}${framework}/theme-framework.js`;
			const genericScriptUrl = `${themeBaseUrl}/theme-generic.js`;
			const scriptsUrls = [
				genericScriptUrl + '?' + fanstatic.trail(),
				styleScriptUrl + '?' + fanstatic.trail(),
			];

			const prom1 = ('less' == mode) 
				? fanstatic.insertLess([
					includeUtility ? `${utilsBaseUrl}_compiler.less?${fanstatic.trail()}` : null,
					`${themeBaseUrl}${framework}/${style}/_compiler.less?${fanstatic.trail()}`,
					]) 
				: (('css-dev' == mode)
					? fanstatic.insertStyles([
						includeUtility ? `${utilsBaseUrl}/_base.css?${fanstatic.trail()}` : null,
						`${themeBaseUrl}_global.css?${fanstatic.trail()}`,
						`${themeBaseUrl}${framework}/_framework.css?${fanstatic.trail()}`,
						`${themeBaseUrl}${framework}/${style}/_base.css?${fanstatic.trail()}`
					])
					: fanstatic.insertStyles([
						includeUtility ? `${utilsBaseUrl}/utils.css?${fanstatic.trail()}` : null,
						`${themeBaseUrl}${framework}/${style}/theme.css?${fanstatic.trail()}`
					]));
			
			const prom2 = fanstatic.insertScripts(scriptsUrls);

			return Promise.all([prom1, prom2]);
		},
	})
		
	window.dispatchEvent(new CustomEvent('fanstatic.style.load'));
}
