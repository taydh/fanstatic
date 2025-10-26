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
			const themeScriptUrl = `${themeScriptPrefix}${storedThemeFramework}/framework.js`;
			const styles = [
				`${themeScriptPrefix}${storedThemeFramework}/${storedTheme}/panels.block.${mode}?${fanstatic.tail()}`,
				`${themeScriptPrefix}${storedThemeFramework}/${storedTheme}/panels.navigation.${mode}?${fanstatic.tail()}`,
				`${themeScriptPrefix}${storedThemeFramework}/${storedTheme}/panels.section.${mode}?${fanstatic.tail()}`,
			];

			const prom1 = fanstatic.insertStyles([
				`${themeScriptPrefix}theme-main.css?${fanstatic.tail()}`,
				`${themeScriptPrefix}${storedThemeFramework}/framework.css?${fanstatic.tail()}`,
				`${themeScriptPrefix}${storedThemeFramework}/${storedTheme}/theme.css?${fanstatic.tail()}`,
			]);

			const prom2 = ('less' == mode) 
				? fanstatic.insertLess([
					`${themeScriptPrefix}${storedThemeFramework}/${storedTheme}/less/theme-load.less?${fanstatic.tail()}`,
					]) : (('less-compiled' == mode) 
						? fanstatic.insertStyles([
							`${themeScriptPrefix}${storedThemeFramework}/${storedTheme}/less-compiled/theme-compiled.css?${fanstatic.tail()}`
						])
						: fanstatic.insertStyles(styles))
			
			const prom3 = fanstatic.insertScripts([
				themeScriptUrl + '?' + fanstatic.tail(),
				'https://cdn.jsdelivr.net/npm/less',
			]);

			return Promise.all([prom1, prom2, prom3]);
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
