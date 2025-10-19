{
	const _elementStorage = new WeakMap();

	Object.assign(fanstatic, {
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

		copyValue: function(inputElem) {
			inputElem.select();
			document.execCommand('copy');
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
	});
	
	window.dispatchEvent(new CustomEvent('fanstatic.tools.load', {
		detail: fanstatic.design
	}));
}
