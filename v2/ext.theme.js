{
	Object.assign(fanstatic, {
		switchTheme: function(theme, themeFramework, prioritize=true) {
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

			const prom1 = fanstatic.insertStyles([
				`${themeScriptPrefix}theme-main.css?${fanstatic.tail()}`,
				`${themeScriptPrefix}${storedThemeFramework}/framework.css?${fanstatic.tail()}`,
				`${themeScriptPrefix}${storedThemeFramework}/${storedTheme}/theme.css?${fanstatic.tail()}`,
				`${themeScriptPrefix}${storedThemeFramework}/${storedTheme}/panels.block.css?${fanstatic.tail()}`,
				`${themeScriptPrefix}${storedThemeFramework}/${storedTheme}/panels.navigation.css?${fanstatic.tail()}`,
				`${themeScriptPrefix}${storedThemeFramework}/${storedTheme}/panels.section.css?${fanstatic.tail()}`,
			]);
			
			const prom2 = fanstatic.insertScripts([themeScriptUrl + '?' + fanstatic.tail()]);

			return Promise.all([prom1, prom2]);
		},

		clearTheme: function() {
			window.localStorage.removeItem('fanstatic.switch_theme');
			window.localStorage.removeItem('fanstatic.switch_theme_framework');
			window.location.reload();
		},

		applyTheme: function() {
			return this.switchTheme(fanstatic.settings.theme, fanstatic.settings.theme_framework);
		},
	})
		
	window.dispatchEvent(new CustomEvent('fanstatic.theme.load'));
}
