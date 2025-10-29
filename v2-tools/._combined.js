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
			var nonEmptyUrls = [];
			for (let url of urls) if (!!url) nonEmptyUrls.push(url);
			urls = nonEmptyUrls;

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
			var nonEmptyUrls = [];
			for (let url of urls) if (!!url) nonEmptyUrls.push(url);
			urls = nonEmptyUrls;

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
			var nonEmptyUrls = [];
			for (let url of urls) if (!!url) nonEmptyUrls.push(url);
			urls = nonEmptyUrls;
			
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
			var nonEmptyItems = [];
			for (let item of items) if (!!item) nonEmptyItems.push(item);
			items = nonEmptyItems;

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
}{
	const _toStyleAttributesString = function(attributes) {
		return Object.entries(attributes).map(([k,v]) => `${k}:${fanstatic.sanitizeAttribute(v)}`).join(';');
	}

	const _toDataAttributesString = function(attributes, suffix = '') {
		return Object.entries(attributes).map(([k,v]) => {
			if (typeof v === 'object') {
				return _toDataAttributesString(v, suffix + k + '-');
			}

			return suffix + `${k}="${fanstatic.sanitizeAttribute(v)}"`
		}).join(' ');
	}

	const _toAttributesString = function(attributes) {
		return Object.entries(attributes).map(([k,v]) => {
			if ('data' === k && typeof v === 'object') {
				return _toDataAttributesString(v, 'data-');
			}
			else if ('style' === k && typeof v === 'object') {
				return 'style="' + _toStyleAttributesString(v) + '"';
			} else {
				return `${k}="${v}"`;
			}
		}).join(' ');
	}

	fanstatic.design = {
		element: function(tag, items = true, attributes = {}) {
			let tagFill = tag + ' ' +  _toAttributesString(attributes);

			return { [tagFill]: items };
		},
		div: function(items = true, attributes = {}) {
			return this.element('div', items, attributes);
		},
		unit: function(model, attributes = {}) {
			let tagFill = ('div data-ds="unit" ' + _toAttributesString(attributes));
			let result = {
				[tagFill]: [],
			};

			if (3 == model.mode) { // head, body, foot
				if (!model.foot) model.foot = true;
				model.cap = false;
			}
			else if (4 == model.mode) { // cap, head, body
				if (!model.cap) model.cap = true;
				model.foot = false;
			}
			else if (1 == model.mode) { // all
				if (!model.foot) model.foot = true;
				if (!model.cap) model.cap = true;
			}
			else if (2 == model.mode) { // head and body only
				model.cap = false;
				model.foot = false;
			}

			if (model.cap) result[tagFill].push({'div data-ds="unit-cap"': model.cap});
			if (model.head) result[tagFill].push({'div data-ds="unit-head"': model.head});
			if (model.body) result[tagFill].push({'div data-ds="unit-body"': model.body});
			if (model.foot) result[tagFill].push({'div data-ds="unit-foot"': model.foot});

			return result;
		},
		axis: function(model, attributes = {}) {
			let tagFill = ('div data-ds="axis" ' +  _toAttributesString(attributes));
			let result = {};

			result[tagFill] = Array.isArray(model) ? model : model.items;

			return result;
		},
		wrap: function(item, attributes = {}) {
			let tagFill = ('div data-ds="wrap" ' +  _toAttributesString(attributes));
			let result = {};

			result[tagFill] = item;

			return result;
		},
		list: function(model, attributes = {}, secondaryAttributes = {}) {
			let listTag = model.listTag || 'ul';
			let itemTag = ('div' == listTag) ? 'div' : 'li';
			let tagFill = (listTag + ' data-ds="list" ' +  _toAttributesString(attributes));
			let result = {};
			let items = (Array.isArray(model) ? model : model.items) || [];

			result[tagFill] = items.map(item => {
				let obj = {};
				obj[itemTag + ' data-ds="list-item" ' +  _toAttributesString(secondaryAttributes)] = item;

				return obj;
			});

			return result;
		},
		grid: function(model, attributes = {}, secondaryAttributes = {}) {
			if (typeof attributes.style === 'object') {
				Object.assign(attributes.style, { display: 'grid' });
			} else {
				attributes.style = (attributes.style || '') + ';display:grid;';
			}

			let tagFill = ('div data-ds="grid" ' +  _toAttributesString(attributes));
			let result = {};
			let items = (Array.isArray(model) ? model : model.items) || [];

			result[tagFill] = items.map(item => {
				let obj = {};
				obj['div data-ds="grid-cell" ' +  _toAttributesString(secondaryAttributes)] = item;

				return obj;
			});

			return result;
		},
		button: function(model, attributes = {},) {
			let tagFill = `button data-ds="button"`;

			return {[tagFill]: model};
		},
		placeholder: function(name) {
			let tagFill = `i data-ds-placeholder="${name}"`;
			
			return {[tagFill]: true}
		},
		axisFlex: function(model, attributes = {}) {
			if (!attributes.style) attributes.style = {};

			if (typeof attributes.style === 'object') {
				Object.assign(attributes.style, { display: 'flex' });
			} else {
				attributes.style = (attributes.style || '') + 'display:flex';
			}

			return this.axis(model, attributes);
		},
		unitFlex: function(model, attributes = {}) {
			if (!attributes.style) attributes.style = {};

			if (typeof attributes.style === 'object') {
				Object.assign(attributes.style, { display: 'flex' });
			} else {
				attributes.style = (attributes.style || '') + ';display:flex;';
			}

			const unit = this.unit(model, attributes);

			if (model.body) {
				Object.entries(unit)[0][1].forEach(el => { 
					const entry = Object.entries(el)[0];

					if(entry[0].includes('data-ds="unit-body"')) {
						el[entry[0] + ' style="flex:1"'] = entry[1];
						delete el[entry[0]];
					}
				})
			}

			return unit;
		},
	};
	
	window.dispatchEvent(new CustomEvent('fanstatic.design.load', {
		detail: fanstatic.design
	}));
}
{
	Object.assign(fanstatic, {
		renderJhtm: function(arr) {
			var html = '';
			
			if (!Array.isArray(arr) && typeof arr === 'object') arr = [arr];
			if (1 == arr.length && null == arr[0]) return html;
			
			for(let entry of arr) {
				if (typeof entry === 'string') {
					html += entry; /* sanitize html or object in user data orchestration level */
					continue;
				}
				else if (typeof entry === 'number') {
					html += String(entry);  /* sanitize html or object in user data orchestration level */
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
					innerHTML = content; /* sanitize html or object in user data orchestration level */
				}
				else if (typeof content === 'number') {
					innerHTML = String(content); /* sanitize html or object in user data orchestration level */
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
{
	const _parseData = function(text, type) {
		switch (type) {
		case 'text/yaml': return jsyaml.load(text); break;
		case 'text/json': return JSON.parse(text); break;
		}
		
		return null;
	};

	fanstatic.assign({
		local_area_id: 'fanstatic-area',
		log_render: false,
	})

	Object.assign(fanstatic._commands, {
		'insert': async function(fanstatic, target, args) {
			var template = args?.template
				|| (target.dataset.templateUrl ? target.dataset.templateUrl : target.querySelector('template'))
			await fanstatic.insert(target, template);
		},
		'replace': async function(fanstatic, target, args) {
			var template = args?.template
				|| (target.dataset.templateUrl ? target.dataset.templateUrl : target.querySelector('template'))
			await fanstatic.replace(target, template);
		},
		'replace-model': async function(fanstatic, target, args) {
			var dataElement = target.querySelector('script[type="text/json"]') || target.querySelector('script[type="text/yaml"]');
			var data = args?.data || _parseData(dataElement.innerHTML, dataElement.getAttribute('type'))
			var template = args?.template
				|| (target.dataset.templateUrl ? target.dataset.templateUrl : target.querySelector('template'))

			await fanstatic.replace(target, template, { model: data, data: data });
		},
		'insert-model': async function(fanstatic, target, args) {
			var dataElement = target.querySelector('script[type="text/json"]') || target.querySelector('script[type="text/yaml"]');
			var data = args?.data || _parseData(dataElement.innerHTML, dataElement.getAttribute('type'))
			var template = args?.template
				|| (target.dataset.templateUrl ? target.dataset.templateUrl : target.querySelector('template'))

			await fanstatic.insert(target, template, { model: data, data: data});
		},
		'replace-yaml': async function(fanstatic, target, args) {
			var data = jsyaml.load(target.querySelector('script[type="text/yaml"]').innerHTML)
			var template = args?.template
				|| (target.dataset.templateUrl ? target.dataset.templateUrl : target.querySelector('template'))
			await fanstatic.replace(target, template, { model: data, data: data });
		},
		'insert-yaml': async function(fanstatic, target, args) {
			var data = jsyaml.load(target.querySelector('script[type="text/yaml"]').innerHTML)
			var template = args?.template
				|| (target.dataset.templateUrl ? target.dataset.templateUrl : target.querySelector('template'))
			await fanstatic.replace(target, template, { model: data, data: data });
		},
		'insert-markdown': async function(fanstatic, target, args) {
			var template = args?.template
				|| (target.dataset.templateUrl ? target.dataset.templateUrl : target.querySelector('template'))
			await fanstatic.insert(target, template, { renderer: 'markdown' });
		},
	});

	Object.assign(fanstatic._commandAttributes, {
		// 'data-run': async function(fanstatic, target, query) {
		// 	await fanstatic.run(target, query)
		// },
		'data-template': async function(fanstatic, target, query) {
			let command = query;
			await fanstatic.runCommand(target, command)
		},
		'data-template-insert': async function(fanstatic, target, query) {
			await fanstatic.runCommand(target, 'insert', {
				template: query || target.querySelector('template')
			})
		},
		'data-template-replace': async function(fanstatic, target, query) {
			await fanstatic.runCommand(target, 'replace', {
				template: query || target.querySelector('template')
			})
		},
		'data-template-insert-model': async function(fanstatic, target, query) {
			await fanstatic.runCommand(target, 'insert-model', {
				template: query || target.querySelector('template'),
				data: fanstatic.elementStorage.get(target).model || null,
			})
		},
		'data-template-replace-model': async function(fanstatic, target, query) {
			await fanstatic.runCommand(target, 'replace-model', {
				template: query || target.querySelector('template'),
				data:  fanstatic.elementStorage.get(target).model || null,
			})
		},
		'data-template-insert-markdown': async function(fanstatic, target, query) {
			await fanstatic.runCommand(target, 'insert-markdown', {
				template: query || target.querySelector('template')
			})
		},
	});

	Object.assign(fanstatic, {
		_getTemplateElement: function(url) {
			return document.getElementById(this.settings.local_area_id)?.querySelector(`template[data-url="${url}"]`)
		},

		_loadTemplate: async function(urlRel, opt){
			let hasError = false
			let tpl = this._getTemplateElement(urlRel)

			try {
				if (!tpl) {
					/* fetch external template */
					const text = await this.fetchText(urlRel, opt)
					
					tpl = document.createElement('template')
					tpl.innerHTML = text
					tpl.setAttribute('data-url', urlRel)

					let fanArea = document.getElementById(this.settings.local_area_id)

					if (!fanArea) {
						fanArea = document.createElement('div')
						fanArea.id = this.settings.local_area_id
						document.body.append(fanArea)
					}

					fanArea.appendChild(tpl)
				}
			} catch (error) {
				hasError = error
				if (error._part) throw error
				else console.error(error.message, urlRel);
			}

			return tpl
		},

		_resolvePartial: function(tplOrUrl, isMustache = false) {
			let tpl = typeof(tplOrUrl) == 'string' ? this._getTemplateElement(url) : tplOrUrl

			if (!tpl) return false

			let url = tpl.getAttribute('data-url')
			let tmp = tpl.content.cloneNode(true)
			let src = Array.from(tmp.children).find(n => n.tagName === 'SCRIPT' && ['', 'javascript'].includes(n.getAttribute('type') || ''))
			let nodes = []

			if (src) tmp.removeChild(src)
		
			for (let c of tmp.childNodes) {
				if (c.tagName) nodes.push(c)
			}

			return { url:url, template:tpl, clonedContent:tmp, childrenNodes:nodes, scriptElement:src }
		},

		_resolveScriptOptions: function(scriptElement, url) {
			var partScriptError = false
			var sourceUrl = url ? url : 'template-' + Date.now()
			var scriptOpt = {
				renderer: null,
				model: null,
				onload: null,
				oninsert: null,
				onrender: null,
				controller: null,
			}

			try {
				let testOpt = (new Function(`\n\n//# sourceURL=${sourceUrl}\n\n` + scriptElement.innerHTML))();

				if (testOpt) {
					partScriptError = true

					if (typeof testOpt === 'object') {
						Object.assign(scriptOpt, testOpt)
					} else if (typeof testOpt === 'function') {
						scriptOpt.onload = testOpt
					}
				}

				return scriptOpt
			}
			catch (error) {
				error._script_url = url

				throw error 
			}
		},

		_onrenderQueue: [],
		
		_insertTemplate: async function(target, url, opt = {}, insertFn) {
			if (['after','before'].includes(insertFn) && target == document.body) {
				console.error('[cannot target document.body with insertAfter method]');
				return;
			}

			if (this.settings.log_render) console.log('🧩 resolving:', url)

			var tpl = (url && typeof(url) === 'object' && url.tagName === 'TEMPLATE')
				? url
				: await this._loadTemplate(url, opt)

			var part = this._resolvePartial(tpl)
			var scriptOpt = {}

			if (!part) return false;

			try {
				if (part.scriptElement) {
					scriptOpt = this._resolveScriptOptions(part.scriptElement, part.url)
				}

				if (opt.renderer) scriptOpt.renderer = opt.renderer
				if (opt.model) scriptOpt.model = !scriptOpt.model ? opt.model : Object.assign(scriptOpt.model, opt.model)

				return await this._processPartial(target, url, opt, insertFn, part, scriptOpt)
			}
			catch (error) {
				console.error('[error insert template]', error)
				return false;
			}
		},

		_processPartial: async function(target, url, opt, insertFn, part, scriptOpt) {
			let tmp = document.createElement('div')
			tmp.append(part.clonedContent)

			let model = scriptOpt.model || {}
			let renderers = scriptOpt.renderer || false ? scriptOpt.renderer.split(',') : []
			let text = tmp.innerHTML

			for (let r of renderers) {
				switch (r) {
				case 'mustache':
					text = Mustache.render(text, model)
					break;
				case 'markdown':
					text = marked.parse(text)
					break;
				case 'yhtm':
					text = this.renderYhtm(text)
					break;
				}
			}

			tmp.innerHTML = text

			/* collect nodes */
			let nodes = [];
			tmp.childNodes.forEach(n => nodes.push(n));

			/* 1st step: load */
			let roof = tmp

			if (scriptOpt.onload) {
				await scriptOpt.onload(roof, opt.data, part.url);
			}

			await this.searchOnLoadAndRun(roof)

			if (opt.postload) {
				await opt.postload(roof, scriptOpt.controller);
			}

			/* 2nd step: insert */
			if (insertFn === 'replaceElement') {
				target['after'](...tmp.childNodes);
				target.remove();
			}
			else {
				target[insertFn](...tmp.childNodes)
			}

			if (this.settings.log_render) console.log('🧵 inserted:', part.url)
			
			/* roof changed after insert */
			roof = ['after','before','replaceElement'].includes(insertFn) ? target.parentElement : target

			if (scriptOpt.oninsert) {
				await scriptOpt.oninsert(nodes, opt.data, part.url);
			}
			
			if (opt.postinsert) {
				await scriptOpt.oninsert(nodes, scriptOpt.controller);
			}

			/* 2nd and a half step: collect onrender */

			if (typeof(scriptOpt.onrender) == 'function') {
				let fn = async function() {
					await scriptOpt.onrender(nodes, opt.data, part.url);
				}

				this._onrenderQueue.push( fn );
			}

			/* run onrender queue if roof in on visible DOM */

			if (document.body.contains(roof)) {
				await this.searchOnRenderAndRun(document.body)

				/* class fix applied after render, be aware this can lead to FOUC issue */
				if (this.settings.class_fix) this.applyClassFix(document)

				if (this.settings.log_render) console.log('🎬 rendered:', part.url)

				if (this._onrenderQueue.length > 0) {
					let fn;
					while(this._onrenderQueue.length > 0) {
						fn = this._onrenderQueue.shift();
						await fn();
					}
				}
			}

			return Object.assign(scriptOpt.controller || {}, 
				{ 
					_template: {
						target: target,
						url: url,
						opt: opt,
						insertFn: insertFn,
						part: part,
						scriptOpt: scriptOpt,
					}
				}
			);
		},

		/* commands */

		searchOnLoadAndRun: async function(roof) {
			return this.searchAndRunCommand(roof);
		},

		searchOnRenderAndRun: async function(roof) {
			let count = 0;
			let targets;
			// let targets = roof.querySelectorAll('[data-command-onrender]')
			
			// for (let target of targets) {
			// 	let cmd = target.dataset.fanstaticCommandOnrender
			// 	target.removeAttribute('data-command-onrender')
			// 	this.run(target, cmd)
			// }

			/* with command attributes */
			for (let cmdSel of Object.entries(this._commandAttributes)) {
				const attr = cmdSel[0] + '-onrender'
				targets = roof.querySelectorAll(`[${attr}]`)
				
				if (targets) {
					count += targets.length

					for (let target of targets) {
						const query = target.getAttribute(attr)
						const fn = cmdSel[1]

						target.removeAttribute(attr)
						await fn(this, target, query)
					}
				}
			}

			if (this.settings.log_render) console.log('searchOnRenderAndRun:', count)
		},

		/* Insert */

		loadTemplates: async function(entries) {
			let me = this;
			let promises = [];

			entries.forEach(entry =>
				promises.push(me._loadTemplate(entry))
			)

			return Promise.all(promises)
		},

		append: function(target, url, opt){
			return this._insertTemplate(target, url, opt, 'append')
		},
		
		prepend: function(target, url, opt){
			return this._insertTemplate(target, url, opt, 'prepend')
		},

		insert: function(target, url, opt){
			return this._insertTemplate(target, url, opt, 'replaceChildren')
		},

		before: function(target, url, opt){
			return this._insertTemplate(target, url, opt, 'before')
		},

		after: function(target, url, opt){
			return this._insertTemplate(target, url, opt, 'after')
		},

		replace: function(target, url, opt){
			return this._insertTemplate(target, url, opt, 'replaceElement')
		},

		appendTemplate: function(...args){ return this.append(...args); },
		prependTemplate: function(...args){ return this.prepend(...args); },
		beforeTemplate: function(...args){ return this.before(...args); },
		afterTemplate: function(...args){ return this.after(...args); },
		insertTemplate: function(...args){ return this.insert(...args); },
		replaceTemplate: function(...args){ return this.replace(...args); },

		/* panel */

		resolvePanelPath: function(panelScope) {
			return fanstatic.settings.base_url + fanstatic.settings.version + '/panels/'+panelScope.replace('.','/')+'.html'
		},
		resolvePanelScope: function(path) {
			const parts = path.split('/').reverse();

			return parts[1] + '.' + parts[0].substring(0, parts[0].lastIndexOf('.'));
		},
		insertPanel: async function(el, panelScope, opt) {
			return await fanstatic.insert(el, this.resolvePanelPath(panelScope), opt);
		},
		replacePanel: async function(el, panelScope, opt) {
			return await fanstatic.replace(el, this.resolvePanelPath(panelScope), opt);
		},
		appendPanel: async function(el, panelScope, opt) {
			return await fanstatic.append(el, this.resolvePanelPath(panelScope), opt);
		},
		prependPanel: async function(el, panelScope, opt) {
			return await fanstatic.prepend(el, this.resolvePanelPath(panelScope), opt);
		},
		beforePanel: async function(el, panelScope, opt) {
			return await fanstatic.before(el, this.resolvePanelPath(panelScope), opt);
		},
		afterPanel: async function(el, panelScope, opt) {
			return await fanstatic.after(el, this.resolvePanelPath(panelScope), opt);
		},

		removeLocalizedTemplates: function() {
			document.getElementById(this.settings.local_area_id).remove();
		},
	})
		
	window.dispatchEvent(new CustomEvent('fanstatic.template.load'));
}
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
{
	const _elementStorage = new WeakMap();

	Object.assign(fanstatic, {
		/* general functions */
		
		copyValue: function(inputElem) {
			inputElem.select();
			document.execCommand('copy');
		},

		getFirstElement: function(elementOrFragment) {
			return elementOrFragment.firstChild ? elementOrFragment.querySelector('*:not(:has(*))') : elementOrFragment;
		},

		parseHTML: function (html, extractFirstElement = false) {
			if (typeof html == 'string') {
				var t = document.createElement('template');
				t.innerHTML = html;

				return extractFirstElement ? this.getFirstElement(t.content) : t.content;
			}

			return html; // not parsed
		},

		/* classfix */

		assignClassFix: function(obj) {
			Object.assign(this.settings.class_fix, obj);
		},

		applyClassFix: function(roof) {
			let elems = []

			Object.entries(this.settings.class_fix).forEach(entry => {
				roof.querySelectorAll(entry[0]).forEach(elem => {
					if (!elem.dataset.classFixed) {
						elems.push(elem)

						let cls = !Array.isArray(entry[1]) ? entry[1] : entry[1][0];
						let stl = !Array.isArray(entry[1]) ? null : entry[1][1];

						if (cls) elem.classList.add(...cls.split(' '));
						if (stl) elem.setAttribute('style', (elem.getAttribute('style') || '') + ';' + stl);
					}
				})
			})

			for (let elem of elems) {
				elem.dataset.classFixed = "1"
			}

			if (this.settings.log_render) console.log(`🎨 class fix applied:`, elems.length)
		},

		/* adoption */

		replaceWithChildren: function(oldParent, wrapper) {
			if (!wrapper) {
				oldParent.after(...oldParent.childNodes)
			}
			else {
				wrapper.append(...oldParent.childNodes)
				oldParent.after(wrapper)
			}
			
			oldParent.remove()
		},

		getSiblingGroups: function(firstChilds) {
			firstChilds = firstChilds.values().toArray();
			var siblingGroups = [];

			for (let e of firstChilds) {
				let siblings = [e];

				while(1) {
					if (!e.nextElementSibling || firstChilds.includes(e.nextElementSibling)) {
						siblingGroups.push(siblings);
						break;
					}

					e = e.nextElementSibling;
					siblings.push(e);
				}
			}

			return siblingGroups;
		},

		adoptSiblings: function(siblingGroupsOrFirstChilds, fnParent = function(){ return document.createElement('div') }, fnGrandParent) {
			var grandParentElement
			var tpl = document.createElement('template')
			var siblingGroups = Array.isArray(siblingGroupsOrFirstChilds)
				? siblingGroupsOrFirstChilds 
				: this.getSiblingGroups(siblingGroupsOrFirstChilds);

			if (fnGrandParent) {
				grandParentElement = fnGrandParent();
			}

			for (let siblings of siblingGroups) {
				let parentElement = fnParent();
				for (let c of siblings) { parentElement.append(c); }
				if (grandParentElement) {
					grandParentElement.append(parentElement);
				}
				else tpl.content.append(parentElement);
			}

			if (grandParentElement) tpl.content.append(grandParentElement)

			return tpl.content
		},

		/* element storage */

		elementStorage: {
			set: function(target, object) {
				let store = this.get(target);
				Object.assign(store, object);
				_elementStorage.set(target, store);
			},

			get: function(target) {
				return _elementStorage.get(target) || {};
			},

			reset: function(target) {
				_elementStorage.delete(target);
			}
		},

		/* sanitizer */

		sanitizeHtml: function(text) {
			const element = document.createElement('div');
			element.innerText = text; // Escapes HTML tags and special characters
			return element.innerHTML;
		},

		sanitizeAttribute: function(value) {
			return value
				.replace(/&/g, '&amp;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#39;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;');
		},

		removePathCharacters: function(value) {
			return value
				.replace(/&/g, '')
				.replace(/"/g, '')
				.replace(/'/g, '')
				.replace(/</g, '')
				.replace(/>/g, '')
				.replace(/\//g, '')
				.replace(/\\/g, '');
		},
	});
	
	window.dispatchEvent(new CustomEvent('fanstatic.tools.load', {
		detail: fanstatic
	}));
}
{
	let _turnCount = 0;
	let style = document.createElement('style');
	
	style.innerHTML = `
*[data-visual-hidden] {
	visibility: hidden;
}`;
	document.head.appendChild(style);

	fanstatic.registerCommand('viewport-enter-animate', function(fanstatic, elem) {
		let animation = elem.dataset.visualAnimation;
		let turn = 0;

		if (animation) {
			fanstatic.visual.onEnterViewport(elem, function(){
				_turnCount++;
				
				let animate = function(){
					let classes = [
						'animate__animated',
						'animate__' + animation,
					];
					
					_turnCount--;

					elem.classList.add(...classes);
					elem.removeAttribute('data-visual-hidden');
					elem.removeAttribute('data-visual-animation');
				};
				
				if (fanstatic.visual.settings.turn_delay > 0) {
					window.setTimeout(animate, (_turnCount - 1) * fanstatic.visual.settings.turn_delay);
				}
				else {
					animate();
				}
			})
		}
		else {
			console.error('data-visual-animation attribute not found')
		}
	})
	
	fanstatic.visual = {
		settings: {
			turn_delay: 100,
			log_render: false,
		},
		isOnScreen: function(elem, allowElemBehind = false, allowElemAhead = false) {
			const scrollDist = document.documentElement.scrollTop;
			const elemOffset = window.scrollY + elem.getBoundingClientRect().top; 

			if (!allowElemBehind && !(elemOffset + elem.offsetHeight > scrollDist))
				return false;

			if (!allowElemAhead && !(scrollDist + window.innerHeight > elemOffset))
				return false;

			return true;
		},
		onEnterViewport: function(elem, handler, runOnce = true) {
			let me = this
			if (this.isOnScreen(elem)) {
				if (this.settings.log_render) console.log('[Visual]', 'already in viewport', elem)
				handler()
				return;
			}

			let evh = function() {
				if (me.isOnScreen(elem)) {
					if (me.settings.log_render) console.log('[Visual]', 'entering viewport', elem)
					handler()

					if (runOnce) window.removeEventListener('scroll', evh)
				}
			}

			window.addEventListener('scroll', evh)
		},
	}
	
	window.dispatchEvent(new CustomEvent('fanstatic.visual.load', {
		detail: fanstatic.visual
	}));
}
