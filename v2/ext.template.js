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
		log_process: false,
	})

	Object.assign(fanstatic._commands, {
		'insert': async function(fanstatic, target, args) {
			var template = args?.template
				|| (target.dataset.templateUrl ? target.dataset.templateUrl : target.querySelector('template'))

			var dataElement = target.querySelector('script[type="text/json"]') || target.querySelector('script[type="text/yaml"]');
			var data = dataElement ? _parseData(dataElement.innerHTML, dataElement.getAttribute('type')) : null

			var templateOptions = Object.assign({
				renderer: target.dataset.templateRenderer || null,
				data: data,
			}, args?.templateOptions || {});
			
			await fanstatic.insert(target, template, templateOptions);
		},
		'replace': async function(fanstatic, target, args) {
			var template = args?.template
				|| (target.dataset.templateUrl ? target.dataset.templateUrl : target.querySelector('template'))

			var dataElement = target.querySelector('script[type="text/json"]') || target.querySelector('script[type="text/yaml"]');
			var data = dataElement ? _parseData(dataElement.innerHTML, dataElement.getAttribute('type')) : null

			var templateOptions = Object.assign({
				renderer: target.dataset.templateRenderer || null,
				data: data,
			}, args?.templateOptions || {});

			await fanstatic.replace(target, template, templateOptions);
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
		'data-fanstatic': async function(fanstatic, target) {
			if ('TEMPLATE' == target.tagName) {
				await fanstatic.runCommand('replace', target, {
					template: target,
				});
			}
		},
		'data-template': async function(fanstatic, target, query) {
			let command = query;
			await fanstatic.runCommand(command, target)
		},
		'data-template-insert': async function(fanstatic, target, query) {
			await fanstatic.runCommand('insert', target, {
				template: query, // default selector sudah tercover di command // || target.querySelector('template')
				templateOptions: fanstatic.elementStorage.get(target, 'templateOptions') || null,
			})
		},
		'data-template-replace': async function(fanstatic, target, query) {
			await fanstatic.runCommand('replace', target, {
				template: query, // default selector sudah tercover di command //|| target.querySelector('template')
				templateOptions: fanstatic.elementStorage.get(target, 'templateOptions') || null,
			})
		},
		'data-template-insert-model': async function(fanstatic, target, query) {
			await fanstatic.runCommand('insert-model', target, {
				template: query, // default selector sudah tercover di command // || target.querySelector('template'),
				data: fanstatic.elementStorage.get(target, 'templateOptions').model || null,
			})
		},
		'data-template-replace-model': async function(fanstatic, target, query) {
			await fanstatic.runCommand('replace-model', target, {
				template: query, // default selector sudah tercover di command // || target.querySelector('template'),
				data:  fanstatic.elementStorage.get(target, 'templateOptions').model || null,
			})
		},
		'data-template-insert-markdown': async function(fanstatic, target, query) {
			await fanstatic.runCommand('insert-markdown', target, {
				template: query // default selector sudah tercover di command // || target.querySelector('template')
			})
		},
	});

	Object.assign(fanstatic, {
		TEMPLATE_OPTMODE: {
			full: 0,
			model: 1,
			data: 2,
		},

		ELEMENT_STORAGE_KEYS: {
			PANEL_CONTROLLER: 'fanstatic.panel_controller',
		},
		
		_getTemplateElement: function(url) {
			return document.getElementById(this.settings.local_area_id)?.querySelector(`template[data-url="${url}"]`)
		},

		_templateCustomerMap: new Map(),

		_loadTemplate: async function(urlRel, opt){
			let hasError = false
			let tpl = this._getTemplateElement(urlRel)
			
			if (!tpl) {
				const templateCustomerMap = fanstatic._templateCustomerMap;

				return new Promise(resolve => {
					window.addEventListener('fanstatic.template_loaded:' + urlRel, () => {
						if (!tpl) {
							tpl = this._getTemplateElement(urlRel);
							templateCustomerMap.get(urlRel).count--;
						}
						
						resolve(tpl);
					});

					if (!templateCustomerMap.has(urlRel) || 0 == templateCustomerMap.get(urlRel).count) {
						templateCustomerMap.set(urlRel, { count: 1 });

						try {
							/* fetch external template */
							this.fetchText(urlRel, opt).then(text => {
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
								window.dispatchEvent(new CustomEvent('fanstatic.template_loaded:' + urlRel));
							})
						} catch (error) {
							hasError = error
							if (error._part) throw error
							else console.error(error.message, urlRel);
						}
					}
					else {
						templateCustomerMap.get(urlRel).count++;
					}
				});
			}
			else {
				return tpl;	
			}
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
				classfix: null,
				model: null,
				onload: null,
				oninsert: null,
				onplace: null,
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

		_onplaceQueue: [],
		
		_insertTemplate: async function(target, url, opt = {}, optMode, insertFn) {
			if (optMode == 1) opt = { model: opt };
			else if (optMode == 2) opt = { data: opt };

			if (['after','before'].includes(insertFn) && target == document.body) {
				console.error('[cannot target document.body with insertAfter method]');
				return;
			}

			if (this.settings.log_process) console.log('🧩 resolving:', url)

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

				if (opt.renderer && !scriptOpt.renderer) scriptOpt.renderer = opt.renderer
				if (opt.classfix) scriptOpt.classfix = Object.assign(scriptOpt.classfix || {}, opt.classfix)
				if (opt.model) scriptOpt.model = Object.assign(scriptOpt.model || {}, opt.model)

				return await this._processPartial(target, url, opt, insertFn, part, scriptOpt)
			}
			catch (error) {
				console.error('[error insert template]', url, error)
				return false;
			}
		},

		_processPartial: async function(target, url, opt, insertFn, part, scriptOpt) {
			let tmp = document.createElement('div');
			tmp.append(part.clonedContent);
			let text = tmp.innerHTML;

			// 1st step A: template text mutation

			if (scriptOpt.mutate) {
				text = scriptOpt.mutate(text);
			}

			// 1st step B: render text with model

			let model = scriptOpt.model || {}
			let renderers = scriptOpt.renderer || false ? scriptOpt.renderer.split(' ') : []

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

			/* 2nd step: onload, postload, run command, apply classfix */

			let nodes = [];
			tmp.childNodes.forEach(n => nodes.push(n));
			
			let roof = tmp

			if (scriptOpt.onload) {
				await scriptOpt.onload(roof, opt.data, part.url);
			}

			if (opt.postload) {
				await opt.postload(roof, scriptOpt.controller);
			}

			/* run commands */
			await this.searchOnLoadAndRun(roof)

			/* apply template classfix, on load not affected by FOUC */
			if (scriptOpt.classfix) this.applyClassfix(roof, scriptOpt.classfix, url);

			/* 3rd step: oninsert and postinsert */
			let targetParentElement = null;

			if (insertFn === 'replaceElement') {
				target['after'](...tmp.childNodes);
				targetParentElement = target.parentElement;
				target.remove();
			}
			else {
				target[insertFn](...tmp.childNodes)
			}

			if (this.settings.log_process) console.log('🧵 inserted:', part.url)
			
			/* roof changed after insert */

			roof = ['after','before','replaceElement'].includes(insertFn) ? (targetParentElement || target.parentElement) : target

			if (scriptOpt.oninsert) {
				await scriptOpt.oninsert(nodes, opt.data, part.url);
			}
			
			if (opt.postinsert) {
				await opt.postinsert(nodes, scriptOpt.controller);
			}

			/* 4th step: collect onplace and put in queue, and process nested onqueue if this the top template */

			if (typeof(scriptOpt.onplace) == 'function') {
				let fn = async function() {
					await scriptOpt.onplace(nodes, opt.data, part.url);
				}

				this._onplaceQueue.push( fn );

				if (opt.postplace) {
					let fn = async function() {
						await opt.postplace(nodes, opt.data, part.url);
					}
					this._onplaceQueue.push( fn );
				}
			}

			/* run onplace queue if roof in on visible DOM */

			if (document.body.contains(roof)) {
				/* run commands */
				await this.searchOnPlaceAndRun(roof)

				if (this.settings.log_process) console.log('🎬 placed:', part.url)

				/* apply global classfix before onplace method called */
				this.applyClassfixes(roof, url);

				/* execute onplace queue, this allow override global classfix when necessary */
				if (this._onplaceQueue.length > 0) {
					let fn;
					while(this._onplaceQueue.length > 0) {
						fn = this._onplaceQueue.shift();
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
			return this.processCommands(roof);
		},

		searchOnPlaceAndRun: async function(roof) {
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
				const attr = cmdSel[0] + '-onplace'
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

			if (this.settings.log_process) console.log('searchOnPlaceAndRun:', count)
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

		append: function(target, url, opt, optMode = 0){
			return this._insertTemplate(target, url, opt, optMode, 'append')
		},
		
		prepend: function(target, url, opt, optMode = 0){
			return this._insertTemplate(target, url, opt, optMode, 'prepend')
		},

		insert: function(target, url, opt, optMode = 0){
			return this._insertTemplate(target, url, opt, optMode, 'replaceChildren')
		},

		before: function(target, url, opt, optMode = 0){
			return this._insertTemplate(target, url, opt, optMode, 'before')
		},

		after: function(target, url, opt, optMode = 0){
			return this._insertTemplate(target, url, opt, optMode, 'after')
		},

		replace: function(target, url, opt, optMode = 0){
			return this._insertTemplate(target, url, opt, optMode, 'replaceElement')
		},

		appendTemplate: function(...args){ return this.append(...args); },
		prependTemplate: function(...args){ return this.prepend(...args); },
		beforeTemplate: function(...args){ return this.before(...args); },
		afterTemplate: function(...args){ return this.after(...args); },
		insertTemplate: function(...args){ return this.insert(...args); },
		replaceTemplate: function(...args){ return this.replace(...args); },

		template: function(url, opt, optMode = 0) {
			this.url = url;
			this.options = opt || {};
			this.optMode = optMode;

			this.assignData = function(assignment) {
				if (fanstatic.TEMPLATE_OPTMODE.data == this.optMode) {
					Object.assign(this.options, assignment);
				}
				if (fanstatic.TEMPLATE_OPTMODE.full == this.optMode) {
					this.options.data = Object.assign(this.options.data || {}, assignment);
				}
			};
		},

		/* panel */

		getPanelControllers: function(elements) {
			return Array.from(elements).map(elem => fanstatic.elementStorage.get(elem, fanstatic.ELEMENT_STORAGE_KEYS.PANEL_CONTROLLER));
		},

		_insertPanel: async function(el, panelScope, opt = {}, optMode, insertFn) {
			return new Promise(async function (resolve) {
				const c = await fanstatic[insertFn](el, fanstatic.resolvePanelPath(panelScope), opt, optMode);
				if (c.panelElement) fanstatic.elementStorage.set(c.panelElement, fanstatic.ELEMENT_STORAGE_KEYS.PANEL_CONTROLLER, c);
				resolve(c);
			});
		},

		resolvePanelScope: function(path) {
			const parts = path.split('/').reverse();

			return parts[1] + '.' + parts[0].substring(0, parts[0].lastIndexOf('.'));
		},
		resolvePanelPath: function(panelScope) {
			const panelBaseUrl = panelScope.match(/^.+?:\/\//i) ? panelScope : fanstatic.settings.base_url + fanstatic.settings.version;
			
			return panelBaseUrl + '/panels/'+panelScope.replace('.','/')+'.html'
		},
		insertPanel: async function(el, panelScope, opt, optMode = 2) {
			return this._insertPanel(el, panelScope, opt, optMode, 'insert');
		},
		replacePanel: async function(el, panelScope, opt, optMode = 2) {
			return this._insertPanel(el, panelScope, opt, optMode, 'replace');
		},
		appendPanel: async function(el, panelScope, opt, optMode = 2) {
			return this._insertPanel(el, panelScope, opt, optMode, 'append');
		},
		prependPanel: async function(el, panelScope, opt, optMode = 2) {
			return this._insertPanel(el, panelScope, opt, optMode, 'replace');
		},
		beforePanel: async function(el, panelScope, opt, optMode = 2) {
			return this._insertPanel(el, panelScope, opt, optMode, 'before');
		},
		afterPanel: async function(el, panelScope, opt, optMode = 2) {
			return this._insertPanel(el, panelScope, opt, optMode, 'after');
		},

		panel: function(panelScope, opt, optMode = 2) {
			this.panelScope = panelScope;
			this.options = opt || {};
			this.optMode = optMode;
			this.getData = function() {
				if (fanstatic.TEMPLATE_OPTMODE.full == this.optMode) {
					if (!this.options.data) this.options.data = {};
					return this.options.data;
				}

				return this.options;
			};
			this.outerScope = function(outerScope) {
				const data = this.getData();
				data.scope = data.scope || outerScope;
			};
			this.assignData = function(assignment) {
				if (fanstatic.TEMPLATE_OPTMODE.data == this.optMode) {
					Object.assign(this.options, assignment);
				}
				if (fanstatic.TEMPLATE_OPTMODE.full == this.optMode) {
					this.options.data = Object.assign(this.options.data || {}, assignment);
				}
			};
		},

		panelController: function(panelElement, scope, panelScope) {
			this.panelElement = panelElement;
			this.scope = scope;
			this.panelScope = panelScope;
			this.select = function(name) { return panelElement.querySelector(`[data-pn="${name}"]`); };
			this.selectAll = function(name) { return panelElement.querySelectorAll(`[data-pn="${name}"]`); };
		},

		isTemplate: function(obj) {
			return this.instanceOfTemplate(obj) || this.instanceOfPanel(obj);
		},

		instanceOfTemplate: function(obj) {
			return (obj instanceof fanstatic.template);
		},

		instanceOfPanel: function(obj) {
			return (obj instanceof fanstatic.panel)
		},

		applyTemplate: async function(target, obj, insertFn) {
			if (fanstatic.instanceOfPanel(obj)) {
				insertFn = (insertFn || 'append') + 'Panel';
				return fanstatic[insertFn](target, obj.panelScope, obj.options, obj.optMode);
			}
			else if (fanstatic.instanceOfTemplate(obj)) {
				insertFn = (insertFn || 'append') + 'Template';
				return fanstatic[insertFn](target, obj.url, obj.options, obj.optMode);
			}

			return false;
		},

		/* Don't implemented array here, use one of the cluster panel and base.jhtm panel to mix */
		applyContent: function(target, content, outerScope = null, insertFn = 'append') {	
			if (fanstatic.isTemplate(content)){
				if (outerScope && fanstatic.instanceOfPanel(content)) content.outerScope(outerScope);

				return fanstatic.applyTemplate(target, content, insertFn);
			} else {
				const tmp = document.createElement('div');
				tmp.innerHTML = fanstatic.renderJhtm ? fanstatic.renderJhtm(content) : content;

				if (insertFn === 'replace') {
					target['after'](...tmp.childNodes);
					target.remove();
				}
				else {
					target[insertFn](...tmp.childNodes)
				}

				tmp.remove();

				return new Promise(rs => rs(null));
			}
		},

		removeLocalizedTemplates: function() {
			const localArea = document.getElementById(this.settings.local_area_id);
			
			if (localArea) localArea.remove();

			this._templateCustomerMap.clear();
		},
	})
		
	window.dispatchEvent(new CustomEvent('fanstatic.template.load'));
}
