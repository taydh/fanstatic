{
	Object.assign(fanstatic, {
		renderJhtm: function(arr) {
			var html = '';
			
			if (!Array.isArray(arr) && typeof arr === 'object') arr = [arr];
			if (1 == arr.length && null == arr[0]) return html;
			
			for(let entry of arr) {
				if (typeof entry === 'string') {
					html += fanstatic.sanitizeHTML(entry);
					continue;
				}
				else if (typeof entry === 'number') {
					html += fanstatic.sanitizeHTML(String(entry));
					continue;
				}
				if (false === !!entry) {
					continue;
				}

				entry = Object.entries(entry)[0];
				let tagFill = entry[0];
				let content = entry[1];
				let tagName = tagFill.split(' ')[0];
				let innerHTML = '';

				if (false === !!content) {
					continue;
				}
				else if (typeof content === 'string') {
					innerHTML = fanstatic.sanitizeHTML(content);
				}
				else if (typeof content === 'number') {
					innerHTML = fanstatic.sanitizeHTML(String(content));
				}
				else if (Array.isArray(content) || typeof content === 'object') {
					innerHTML = this.renderJhtm(content);
				}

				html += `<${tagFill}>${innerHTML}</${tagName}>`;
			}

			return html
		},

		renderYhtm: function (yaml) {
			if (!window.jsyaml) {
				console.error('[Please load JS-YAML library first]');
			}

			var o = jsyaml.load(yaml)
			let html = this.renderJhtm(o)

			return html
		},
	})
		
	window.dispatchEvent(new CustomEvent('fanstatic.structured_html.load'));
}
