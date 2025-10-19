// fanstatic variable but only consist of headjack functions
var fanstatic = {
    asHeadjack: true,
	insertScripts: function (urls, defaultProperties = { defer: 1 }) {
		return new Promise((resolve) => {
			let el
			let count = urls.length

			for (let url of urls) {
				el = document.createElement('script')
				el.onload = function(){
					if (0 == --count) {
						resolve(true)
					}
				};

				for (let entry of Object.entries(defaultProperties)) {
					el[entry[0]] = entry[1]
				}

				if (typeof url === 'object') {
					el.src = url.src

					for (let entry of Object.entries(url.attributes || {})) {
						el.setAttribute(entry[0], entry[1])
					}
				}
				else {
					el.src = url;
				}

				document.head.appendChild(el);
			}
		});
	},

	insertStyles: function (urls) {
		var el;

		for (let url of urls) {
			el = document.createElement('link')
			el.setAttribute('rel','stylesheet')
			el.href = url

			document.head.appendChild(el)
		}
	},

	insertPreloads: function (items) {
		var el;

		for (let item of items) {
			el = document.createElement('link')
			el.setAttribute('rel','preload')
			el.href = item.url
			el.as = item.as

			document.head.appendChild(el)
		}
	},

	asyncCounter : function(count, onComplete) {
		return {
			counter: count,
			done: function() {
				if (0 == --this.counter) onComplete();
			}
		}
	},
};
