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
			
			if (opt.postinsert) {
				await scriptOpt.oninsert(nodes, controller);
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

		/* classfix */

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

		/* commands */

		_commandAttributes: {
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
					data: target._model || null,
				})
			},
			'data-template-replace-model': async function(fanstatic, target, query) {
				await fanstatic.runCommand(target, 'replace-model', {
					template: query || target.querySelector('template'),
					data:  target._model || null,
				})
			},
			'data-template-insert-markdown': async function(fanstatic, target, query) {
				await fanstatic.runCommand(target, 'insert-markdown', {
					template: query || target.querySelector('template')
				})
			},
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
	})
		
	window.dispatchEvent(new CustomEvent('fanstatic.template.load'));
}
