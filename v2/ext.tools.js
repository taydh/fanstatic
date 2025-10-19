{
	Object.assign(fanstatic, {
		/* TOOLS */
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

		copyValue: function(inputElem) {
			inputElem.select();
			document.execCommand('copy');
		},
	});
	
	window.dispatchEvent(new CustomEvent('fanstatic.tools.load', {
		detail: fanstatic.design
	}));
}
