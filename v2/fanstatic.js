/**
 * author: Taufan
 * email: contact@annexdesk.com
 * license: Apache-2.0
 * description: Collection of methods to fill the role of HTML templating.
 * purpose: help build web pages with static page approach.
 */
{
	const _resolveSpan = function(span) {
		let p = span.slice(-1)
		let n = span.slice(0, -1)
		let secMap = {d:86400, h:3600, m:60, s:1}
		
		return secMap[p] * n * 1000
	}

	const _resolveCustomTail = function(opt, settings) {
		if (opt.hasOwnProperty('tail_key') && !opt.tail_key) return { key: null, value: null };
		else if (!opt.hasOwnProperty('tail_key')) return false;

		let tail_key = opt.hasOwnProperty('tail_key') ? opt.tail_key : settings.tail_key
		let tail_span = opt.hasOwnProperty('tail_span') ? opt.tail_span : settings.tail_span
		let vs = vn = Date.now()
		let diff = _resolveSpan(tail_span)

		vs = (vn - diff) < vs ? vs: vn

		return {key: tail_key, value: String(vs)}
	};
	
	var fanstatic = {
		settings: {
			base_url: '/',
			tail_key: '_',
			tail_span: '1d', //dhms
		},

		assign: function(opt) {
			Object.assign(this.settings, opt)
		},

		/* headjack scripts */
		
		insertScripts: function (urls, defaultProperties = { defer: 1 }) {
			return new Promise((resolve) => {
				var el
				var asyncCounter = this.asyncCounter(urls.length, () => resolve(true))

				for (let url of urls) {
					el = document.createElement('script')
					el.onload = (() => asyncCounter.done());
					el.onerror = (() => asyncCounter.done());

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
			return new Promise((resolve) => {
				var el;
				var asyncCounter = this.asyncCounter(urls.length, () => resolve(true))

				for (let url of urls) {
					el = document.createElement('link')
					el.onload = (() => asyncCounter.done());
					el.onerror = (() => asyncCounter.done());

					el.setAttribute('rel','stylesheet')
					el.href = url

					document.head.appendChild(el)
				}
			})
		},

		insertLess: function (urls) {
			return new Promise((resolve) => {
				var el;
				var asyncCounter = this.asyncCounter(urls.length, () => resolve(true))

				for (let url of urls) {
					el = document.createElement('link')
					el.onload = (() => asyncCounter.done());
					el.onerror = (() => asyncCounter.done());
					
					asyncCounter.done(); // no onload triggered

					el.setAttribute('rel','stylesheet/less');
					el.setAttribute('type','text/css');
					el.href = url

					document.head.appendChild(el)
				}
			})	
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

		/* tail */

		tail: function(asObjet = false) {
			if (!this.settings.tail_key || !this.settings.tail_span) return { key:null, value:null};

			let vn = vs = Date.now()
			let diff = _resolveSpan(this.settings.tail_span)

			if (localStorage.hasOwnProperty('fanstatic_tail_value')) {
				vs = localStorage.getItem('fanstatic_tail_value')
				vs = (vn - diff) < vs ? vs: vn
			}

			if (vs == vn) {
				localStorage.setItem('fanstatic_tail_value', vs)
			}

			let tail = {key: this.settings.tail_key, value: String(vs)}

			return asObjet
				? tail
				: `${tail.key}=${tail.value}`
		},
		
		/* Fetch */

		fetchUrls: async function(urls, opt) {
			let result = []

			for (let url of urls) {
				let urlOpt

				if (typeof url == 'object') {
					urlOpt = url
					url = urlOpt.url
				}

				if (!url.startsWith('http') && url[0] != '/') {
					url = this.settings.base_url + url
				}

				/* resolve tail */
				let tail = _resolveCustomTail(opt || {}, this.settings) || this.tail(true)
				if (url[0] == '/') url = window.location.origin + url;
				url = new URL(url)
				if (tail.key) url.searchParams.append(...Object.values(tail))

				/* fetch external template */
				const response = await fetch(url);

				if (!response.ok) {
					throw new Error(`[External text not found]`, url);
				}
			
				try {
					let type = urlOpt?.type || opt?.type || 'text'

					result.push(await ((type == 'json')
						? response.json() 
						: response.text()));
				}
				catch(err) {
					console.error('[File fetch error]', url.href, err)
					result.push(null)
				}
			}

			return result;
		},

		fetchText: async function(urlRel, opt = {}) {
			let isArray = Array.isArray(urlRel)
			let result = await this.fetchUrls(isArray ? urlRel : [urlRel], Object.assign(opt, { type: 'text' }))
			return isArray ? result : result[0];
		},

		fetchJson: async function(urlRel, opt = {}) {
			let isArray = Array.isArray(urlRel)
			let result = await this.fetchUrls(isArray ? urlRel : [urlRel], Object.assign(opt, { type: 'json' }))
			return isArray ? result : result[0];
		},

		/* url */

		getLandingPath: function(appendSlash = false) {
			let path = (window.location.origin + window.location.pathname)
				.slice(this.settings.base_url?.length - 1 || 0);

			return appendSlash ? ('/' == path[path.length - 1] ? path : path + '/') : path;
		},
		
		getLandingPathEntries: function() {
			return this.getLandingPath(true).split('/').slice(1,-1)
		},

		getLandingPage: function(route, appendSlash = false) {
			let lp = this.getLandingPath(appendSlash)
			let entry = Object.entries(route).find(a => a[1].includes(lp))

			return entry ? entry[0] : null;
		},

		/* adjacent html */

		insertHtml: function(el, html) { 
			el.empty();
			el.insertAdjacentHTML('beforeend', html);
		},
		replaceHtml: function(el, html) { 
			el.insertAdjacentHTML('afterend', html);
			el.remove();
		},
		beforeHtml: function(el, html) { el.insertAdjacentHTML('beforebegin', html); },
		prependHtml: function(el, html) { el.insertAdjacentHTML('afterbegin', html); },
		appendHtml: function(el, html) { el.insertAdjacentHTML('before', html); },
		afterHtml: function(el, html) { el.insertAdjacentHTML('afterend', html); },

		/* Commands */
		_commandAttributes: {},
		_commands: {},

		registerCommand: function(command, fn) {
			if (this._commands.hasOwnProperty(command)) {
				throw '❌ Fail registering command: already exists';
			}

			this._commands[command] = fn
		},

		run: function(target, command, args) {
			return this.runCommand(target, command, args);
		},

		runCommand: function(target, command, args) {
			if (this.settings.log_render) console.log('🤖 command:', command, target)

			let fn = this._commands[command]
			
			if (fn) return fn(this, target, args)
		},

		searchAndRunCommand: async function(roof, suffix='') {
			let targets;

			/* with command attributes */
			for (let cmdSel of Object.entries(this._commandAttributes)) {
				const attr = cmdSel[0] + suffix;
				targets = roof.querySelectorAll(`[${attr}]`);

				if (targets) {
					for (let target of targets) {
						const query = target.getAttribute(cmdSel[0])
						const fn = cmdSel[1]

						target.removeAttribute(cmdSel[0])
						await fn(this, target, query)
					}
				}
			}
		},
	}

	window.dispatchEvent(new CustomEvent('fanstatic.load'), { detail: fanstatic })
	console.log('⭐ fanstatic usage visit https://fanstatic.annexdesk.com/docs/?doc=script-help')
}