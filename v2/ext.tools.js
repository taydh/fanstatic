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

		assignClassfix: function(obj) {
			if (!this._classfix) this._classfix = {};
			Object.assign(this._classfix, obj);
		},

		getClassfix: function() {
			return this._classfix;
		},

		applyClassfix: function(roof, source = null) {
			source = source || this._classfix;

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

				if (this.settings.log_render) console.log('🎨 classfix evaluated:', sourceArr.length, 'applied:', elems.length);
			}
			else {
				console.log('🎨 no classfix evaluated');
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
