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

		/* classfix */

		_classfixes: {
			general: {}
		},

		assignClassfix: function(obj, name="general") {
			Object.assign(this._classfixes[name], obj);
		},

		setClassfix: function(name, obj) {
			this._classfixes[name] = obj;
		},

		getClassfix: function(name="general") {
			return this._classfixes[name];
		},

		removeClassfix: function(name) {
			delete this._classfixes[name];
		},

		applyClassfixes: function(roof, label) {
			Object.entries(this._classfixes).forEach(([k,o]) => {
				this.applyClassfix(roof, o, `(${k}) ` + label);
			});
		},

		applyClassfix: function(roof, source, label="") {
			const elems = []
			const sourceArr = source ? Object.entries(source) : null;

			if (sourceArr) {
				sourceArr.forEach(entry => {
					roof.querySelectorAll(entry[0]).forEach(elem => {
						// if (!elem.dataset.classFixed) {
							elems.push(elem)

							let cls = !Array.isArray(entry[1]) ? entry[1] : entry[1][0];
							let stl = !Array.isArray(entry[1]) ? null : entry[1][1];

							if (cls) elem.classList.add(...cls.split(' '));
							if (stl) elem.setAttribute('style', (elem.getAttribute('style') || '') + ';' + stl);
						// }
					})
				})

				// 2025-11-04 Probably no need for classFixed, applyClassfix must be run once anywhere by template or global
				// for (let elem of elems) {
				// 	elem.dataset.classFixed = "1"
				// }

				if (this.settings.log_render) 
					console.log(`🎨 classfix evaluated at ${label}:`, sourceArr.length, 'applied:', elems.length);
			}
			else {
				if (this.settings.log_render) 
					console.log(`🎨 no classfix evaluated at ${label}`);
			}
		},

		/* adoption */

		replaceWithChildren: function(oldParent, wrapper = null) {
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
			_loadStore: function(target) {
				if ('string' == typeof(target)) {
					target = document.querySelector(target);
				}
				
				if (_elementStorage.has(target)) {
					return _elementStorage.get(target);
				}
				else {
					const store = {};
					_elementStorage.set(target, store);

					return store;
				}
			},

			set: function(target, key, val) {
				const store = this._loadStore(target);
				store[key] = val;
			},

			get: function(target, key) {
				const store = this._loadStore(target);

				return store[key];
			},

			unset: function(target, key) {
				const store = this._loadStore(target);

				delete store[key];
			},

			delete: function(target) {
				_elementStorage.delete(target);
			}
		},

		/* sanitizer */

		escapeHtml: function(text) {
			const element = document.createElement('div');
			element.textContent = text; // Escapes HTML tags and special characters
			return element.innerHTML;
		},

		sanitizeAttrValue: function(value) {
			if ('string' != typeof(value)) return '';

			return value
				.replace(/&/g, '&amp;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#39;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;');
		},

		sanitizeFilename: function(input) {
			// 1. Remove any path traversal attempts (slashes, backslashes, colons)
			let sanitized = input.replace(/[\/\\:*?"<>|]/g, '');

			// 2. Allow only safe characters: letters, numbers, underscore, dash, dot
			sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '');

			// 3. Prevent hidden files (like ".env") by stripping leading dots
			sanitized = sanitized.replace(/^\.+/, '');

			// 4. Enforce a max length (optional, e.g., 255 chars)
			sanitized = sanitized.substring(0, 255);

			// 5. Default filename if empty after sanitization
			if (!sanitized) {
				sanitized = '_empty_sanitized_filename_';
			}

			return sanitized;
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
