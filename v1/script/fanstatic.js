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

	const _resolveCustomTail = function(opt) {
		if (opt.hasOwnProperty('tail_key') && !opt.tail_key) return { key: null, value: null };
		else if (!opt.hasOwnProperty('tail_key')) return false;

		let tail_key = opt.hasOwnProperty('tail_key') ? opt.tail_key : this.settings.tail_key
		let tail_span = opt.hasOwnProperty('tail_span') ? opt.tail_span : this.settings.tail_span
		let vs = vn = Date.now()
		let diff = _resolveSpan(tail_span)

		vs = (vn - diff) < vs ? vs: vn

		return {key: tail_key, value: String(vs)}
	}

	const _parseData = function(text, type) {
		switch (type) {
		case 'text/yaml': return jsyaml.load(text); break;
		case 'text/json': return JSON.parse(text); break;
		}
		
		return null;
	}

	var st = fanstatic = {
		settings: {
			base_url: '/',
			local_area_id: 'fanstatic-area',
			tail_key: '_',
			tail_span: '1d', //dhms
			log_render: false,
		},

		assign: function(opt) {
			Object.assign(this.settings, opt)
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
				let tail = _resolveCustomTail(opt || {}) || this.tail(true)
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

		// fetchText: async function(urlRel, opt) {
		// 	let isArray = Array.isArray(urlRel)
		// 	let urls = isArray ? urlRel : [urlRel]
		// 	let result = []

		// 	for (let url of urls) {
		// 		if (!url.startsWith('http') && url[0] != '/') {
		// 			url = this.settings.base_url + url
		// 		}

		// 		/* resolve tail */
		// 		let tail = _resolveCustomTail(opt || {}) || this.tail(true)
		// 		if (url[0] == '/') url = window.location.origin + url;
		// 		url = new URL(url)
		// 		if (tail.key) url.searchParams.append(...Object.values(tail))

		// 		/* fetch external template */
		// 		const response = await fetch(url);

		// 		if (!response.ok) {
		// 			throw new Error(`[External text not found]`, url);
		// 		}
			
		// 		try {
		// 			result.push(await ((opt?.type == 'json')
		// 				? response.json() 
		// 				: response.text()));
		// 		}
		// 		catch(err) {
		// 			console.error('[File fetch error]', err, url.href)
		// 			result.push(null)
		// 		}
		// 	}

		// 	return (result && !isArray) ? result[0] : result;
		// },

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

		/* STRUCTURED TO HTML */

		renderJhtm: function(arr) {
			var html = ''
			
			for(let entry of arr) {
				entry = Object.entries(entry)[0]
				let tagFill = entry[0]
				let content = entry[1]
				let tagName = tagFill.split(' ')[0]
				let innerHTML = ''

				if (typeof content === 'string') {
					innerHTML = content
				}
				else if (Array.isArray(content)) {
					innerHTML = this.renderJhtm(content)
				}

				html += `<${tagFill}>${innerHTML}</${tagName}>`
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

		/* url */

		/**
		 * get path relative to fanstatic.settings.base_url
		 * @param {*} appendSlash 
		 * @returns 
		 */
		getLandingPath: function(appendSlash = false) {
			let path = (window.location.origin + window.location.pathname)
				.slice(this.settings.base_url?.length - 1 || 0);

			return appendSlash ? ('/' == path[path.length - 1] ? path : path + '/') : path;
		},
		
		/**
		 * get splitted path relative to fanstatic.settings.base_url
		 * @param {*} appendSlash 
		 * @returns 
		 */
		getLandingPathEntries: function() {
			return this.getLandingPath(true).split('/').slice(1,-1)
		},

		getLandingPage: function(route, appendSlash = false) {
			let lp = this.getLandingPath(appendSlash)
			let entry = Object.entries(route).find(a => a[1].includes(lp))

			return entry ? entry[0] : null;
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

		/* theme */

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

		/* Loader */
		
		insertScripts: function (urls, defaultProperties = { 'defer': 1 }) {
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

		/* collect html tags */

		parseHTML: function (html) {
			if (typeof html == 'string') {
				var t = document.createElement('template');
				t.innerHTML = html;
				return t.content;
			}

			return html; // is element
		},

		replaceWithChildren: function(oldParent, newParent) {
			if (!newParent) {
				oldParent.after(...oldParent.childNodes)
			}
			else {
				newParent.append(...oldParent.childNodes)
				oldParent.after(newParent)
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
			var grandParentSurround, grandParentElement
			var tpl = document.createElement('template')
			var siblingGroups = Array.isArray(siblingGroupsOrFirstChilds)
				? siblingGroupsOrFirstChilds 
				: this.getSiblingGroups(siblingGroupsOrFirstChilds);

			if (fnGrandParent) {
				grandParentSurround = fnGrandParent();
				grandParentElement = grandParentSurround.firstChild ? grandParentSurround.querySelector('*:not(:has(*))') : grandParentSurround
			}

			for (let siblings of siblingGroups) {
				let parentSurround = fnParent();
				let parentElement = parentSurround.firstChild ? parentSurround.querySelector('*:not(:has(*))') : parentSurround
				for (let c of siblings) { parentElement.append(c); }
				if (grandParentSurround) {
					grandParentElement.append(parentSurround);
				}
				else tpl.content.append(parentSurround);
			}

			if (grandParentSurround) tpl.content.append(grandParentSurround)

			return tpl.content
		},

		/* template */

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
			var sourceUrl = url ? url.replaceAll('/', '').replaceAll('.', '') : 'template-' + Date.now()
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
			
			/* obsolete or wrong method? */
			if (opt.postinsert) {
				//await scriptOpt.oninsert(nodes, controller);
				await opt.postinsert(nodes, scriptOpt.controller);
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

			return {
				target: target,
				url: url,
				opt: opt,
				insertFn: insertFn,
				part: part,
				scriptOpt: scriptOpt,
			};
		},

		/* Commands */

		_commandAttributes: {
			// 'data-run': async function(fanstatic, target, query) {
			// 	await fanstatic.run(target, query)
			// },
			'data-command': async function(fanstatic, target, query) {
				await fanstatic.run(target, query)
			},
			'data-command-insert': async function(fanstatic, target, query) {
				await fanstatic.run(target, 'insert', {
					template: query || target.querySelector('template')
				})
			},
			'data-command-replace': async function(fanstatic, target, query) {
				await fanstatic.run(target, 'replace', {
					template: query || target.querySelector('template')
				})
			},
			'data-command-insert-model': async function(fanstatic, target, query) {
				await fanstatic.run(target, 'insert-model', {
					template: query || target.querySelector('template'),
					data: target._model || null,
				})
			},
			'data-command-replace-model': async function(fanstatic, target, query) {
				await fanstatic.run(target, 'replace-model', {
					template: query || target.querySelector('template'),
					data:  target._model || null,
				})
			},
			'data-command-insert-markdown': async function(fanstatic, target, query) {
				await fanstatic.run(target, 'insert-markdown', {
					template: query || target.querySelector('template')
				})
			},
		},

		_commands: {
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
		},

		registerCommand: function(command, fn) {
			if (this._commands.hasOwnProperty(command)) {
				throw '❌ Fail registering command: already exists';
			}

			this._commands[command] = fn
		},

		run: function(target, command, args) {
			if (this.settings.log_render) console.log('🤖 command:', command, target)

			let fn = this._commands[command]
			if (fn) return fn(this, target, args)
		},

		searchAndRun: async function(roof) {
			return this.searchOnLoadAndRun(roof);
		},

		searchOnLoadAndRun: async function(roof) {
			let targets;
			// let targets = roof.querySelectorAll('[data-command]')
			
			// if (targets) {
			// 	for (let target of targets) {
			// 		let cmd = target.dataset.fanstaticCommand
			// 		target.removeAttribute('data-command')
			// 		await this.run(target, cmd)
			// 	}
			// }

			/* with command attributes */
			for (let cmdSel of Object.entries(this._commandAttributes)) {
				targets = roof.querySelectorAll(`[${cmdSel[0]}]`)

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

		/* TOOLS */
		copyValue: function(inputElem) {
			inputElem.select();
			document.execCommand('copy');
		},
	}

	window.dispatchEvent(new CustomEvent('fanstatic.load'), { detail: fanstatic })
	console.log('⭐ fanstatic usage visit https://fanstatic.annexdesk.com/docs/?doc=script-help')
}