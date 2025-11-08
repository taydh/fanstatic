{
	Object.assign(fanstatic, {
		applyTheme: function(style = fanstatic.settings.theme_style, framework = fanstatic.settings.theme_framework, opt = { mode: fanstatic.settings.theme_mode }) {
			const mode = opt.mode || 'css';

			console.log('🖼️ Style theme applied: ' + style + ' (' + framework + '), mode: ' + mode);

			const utilsUrl = `${fanstatic.settings.base_url}${fanstatic.settings.version}/utils/`;
			const themeScriptPrefix = `${fanstatic.settings.base_url}${fanstatic.settings.version}/themes/`;
			const themeScriptUrl = `${themeScriptPrefix}${framework}/theme-framework.js`;
			const scriptsUrls = [
				themeScriptUrl + '?' + fanstatic.trail(),
				('less' == mode) ? fanstatic.settings.library_less_url || null : false,
			];

			const prom1 = ('less' == mode) 
				? fanstatic.insertLess([
					`${utilsUrl}_compiler.less?${fanstatic.tail()}`,
					`${themeScriptPrefix}${framework}/${style}/_compiler.less?${fanstatic.tail()}`,
					]) 
				: (('css-dev' == mode)
					? fanstatic.insertStyles([
						`${utilsUrl}/_base.css?${fanstatic.tail()}`
						`${themeScriptPrefix}_global.css?${fanstatic.tail()}`,
						`${themeScriptPrefix}${framework}/_framework.css?${fanstatic.tail()}`,
						`${themeScriptPrefix}${framework}/${style}/_base.css?${fanstatic.tail()}`
					])
					: fanstatic.insertStyles([
						`${utilsUrl}/utils.css?${fanstatic.tail()}`
						`${themeScriptPrefix}${framework}/${style}/theme.css?${fanstatic.tail()}`
					]));
			
			const prom2 = fanstatic.insertScripts(scriptsUrls);

			return Promise.all([prom1, prom2]);
		},
	})
		
	window.dispatchEvent(new CustomEvent('fanstatic.style.load'));
}
