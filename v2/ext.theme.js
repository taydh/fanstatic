{
	Object.assign(fanstatic, {
		switchTheme: function(theme, themeFramework, opt = { }) {
			const prioritize = opt.prioritize || true;
			const mode = opt.mode || 'css';

			var storedTheme = window.localStorage.getItem('fanstatic.switch_theme');
			var storedThemeFramework = window.localStorage.getItem('fanstatic.switch_theme_framework');

			if (theme && prioritize && (theme != !storedTheme) && (themeFramework != storedThemeFramework)) { // store theme and reload
				storedTheme = theme;
				storedThemeFramework = themeFramework;
				window.localStorage.setItem('fanstatic.switch_theme', storedTheme);
				window.localStorage.setItem('fanstatic.switch_theme_framework', storedThemeFramework);
				window.location.reload();
			}

			if (!storedTheme) return; // no theme

			const themeScriptPrefix = `${fanstatic.settings.base_url}${fanstatic.settings.version}/themes/`;
			const themeScriptUrl = `${themeScriptPrefix}${storedThemeFramework}/theme-framework.js`;

			const prom1 = ('less' == mode) 
				? fanstatic.insertLess([
					`${themeScriptPrefix}${storedThemeFramework}/${storedTheme}/less/theme.less?${fanstatic.tail()}`,
					]) : (('css-dev' == mode) 
						? fanstatic.insertStyles([
							`${themeScriptPrefix}theme-base.css?${fanstatic.tail()}`,
							`${themeScriptPrefix}${storedThemeFramework}/theme-framework.css?${fanstatic.tail()}`,
							`${themeScriptPrefix}${storedThemeFramework}/${storedTheme}/css-dev/theme.css?${fanstatic.tail()}`
						])
						: fanstatic.insertStyles([
							`${themeScriptPrefix}${storedThemeFramework}/${storedTheme}/theme.css?${fanstatic.tail()}`
						]))
			
			const scriptsUrls = [
				themeScriptUrl + '?' + fanstatic.tail(),
			];

			if (fanstatic.settings.library_less_url) scriptsUrls.push(fanstatic.settings.library_less_url);

			const prom2 = fanstatic.insertScripts(scriptsUrls);

			return Promise.all([prom1, prom2]);
		},

		clearTheme: function() {
			window.localStorage.removeItem('fanstatic.switch_theme');
			window.localStorage.removeItem('fanstatic.switch_theme_framework');
			window.location.reload();
		},

		applyTheme: function() {
			return this.switchTheme(fanstatic.settings.theme, fanstatic.settings.theme_framework, {
				prioritize: fanstatic.settings.theme_prioritize,
				mode: fanstatic.settings.theme_mode,
			});
		},
	})
		
	window.dispatchEvent(new CustomEvent('fanstatic.theme.load'));
}
