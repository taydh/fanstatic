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
		applyTheme: function(opt={}) {
			let theme = opt.theme || fanstatic.settings.theme || null;
			let framework = opt.framework || fanstatic.settings.theme_framework || null;
			const mode = opt.mode || fanstatic.settings.theme_mode || 'css';
			const includeGlobal = opt.includeGlobal || true;
			const includeUtility = opt.includeUtility || false;
			const styleBaseUrl = fanstatic.withTrailingSlash(fanstatic.settings.style_base_url || fanstatic.getVersionedBaseUrl());

			// sanitize values
			theme = fanstatic.removePathCharacters(theme);
			framework = framework ? fanstatic.removePathCharacters(framework) : null;

			console.log('🖼️ Style theme applied: ' + theme + ' (' + framework + '), mode: ' + mode);

			// const utilsBaseUrl = `${styleBaseUrl}utils/`;
			const themeFrameworkBaseUrl = framework ? `${styleBaseUrl}theme-framework-adapters/${framework}/` : null;
			const themeBaseUrl = fanstatic.settings.theme_base_url || `${styleBaseUrl}themes/${theme}/`;

			const prom1 = ('less' == mode) 
				? fanstatic.insertLess([
					includeGlobal ? `${styleBaseUrl}themes/_global.less?${fanstatic.trail()}` : null,
					includeUtility ? `${utilsBaseUrl}_compiler.less?${fanstatic.trail()}` : null,
					`${themeBaseUrl}less/_theme.less?${fanstatic.trail()}`,
					framework ? `${themeFrameworkBaseUrl}less/_adapter.less?${fanstatic.trail()}` : null,
					]) 
				: (('css-dev' == mode)
					? fanstatic.insertStyles([
						includeUtility ? `${utilsBaseUrl}_base.css?${fanstatic.trail()}` : null,
						`${styleBaseUrl}themes/_global.css?${fanstatic.trail()}`,
						`${themeFrameworkBaseUrl}_framework.css?${fanstatic.trail()}`,
						`${themeBaseUrl}_base.css?${fanstatic.trail()}`
					])
					: fanstatic.insertStyles([ // mode == 'css'
						includeUtility ? `${utilsBaseUrl}utils.css?${fanstatic.trail()}` : null,
						`${themeBaseUrl}theme.css?${fanstatic.trail()}`
					]));

			const scriptsUrls = [
				includeGlobal ? `${styleBaseUrl}themes/theme-global-script.js` + '?' + fanstatic.trail() : false,
				`${themeBaseUrl}theme-script.js` + '?' + fanstatic.trail(),
				framework ? `${themeFrameworkBaseUrl}theme-adapter-script.js` + '?' + fanstatic.trail() : null,
			];

			const prom2 = fanstatic.insertScripts(scriptsUrls);
			const prom3 = ('less' == mode) ? this.applyLess() : new Promise(rs => rs(null));

			return Promise.all([prom1, prom2, prom3]);
		},
	})
		
	window.dispatchEvent(new CustomEvent('fanstatic.style.load'));
}
