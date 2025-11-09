{
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

	Object.assign(fanstatic, {
		tagFillContains: function(obj, searchText) {
			return ('object' == typeof obj) && obj ? Object.entries(obj)[0][0].includes(searchText) : false;
		},
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
	});

	fanstatic.design = {
		element: function(tag, attributes = {}, items = true) {
			if (('object' != typeof attributes) || Array.isArray(attributes)) {
				items = attributes;
				attributes = {};
			}

			let tagFill = tag + ' ' +  _toAttributesString(attributes);

			return { [tagFill]: items };
		},
		div: function(attributes = {}, items = true) {
			if (('object' != typeof attributes) || Array.isArray(attributes)) {
				items = attributes;
				attributes = {};
			}

			return this.element('div', attributes, items);
		},
		par: function(attributes = {}, items = true) {
			if (('object' != typeof attributes) || Array.isArray(attributes)) {
				items = attributes;
				attributes = {};
			}

			return this.element('p', attributes, items);
		},
		unit: function(attributes = {}, model) {
			if (!model){
				if (Object.keys(attributes).some(k => 'figure' == k || 'subjects' == k || 'message' == k || 'notes' == k)) {
					model = attributes;
					attributes = {};
				}
				else { // for fully empty model
					model = {};
				}
			}

			let tagFill = ('div data-ds="unit" ' + _toAttributesString(attributes));
			let result = {
				[tagFill]: [],
			};

			if (1 == model.mode) { // all
				if (!model.notes) model.notes = true;
				if (!model.figure) model.figure = true;
			}
			else if (2 == model.mode) { // head and body only
				model.figure = false;
				model.notes = false;
			}
			else if (3 == model.mode) { // head, body, foot
				if (!model.notes) model.notes = true;
				model.figure = false;
			}
			else if (4 == model.mode) { // cap, head, body
				if (!model.figure) model.figure = true;
				model.notes = false;
			}

			if (model.figure) result[tagFill].push({'figure data-ds="fig"': model.figure});
			if (model.subjects) result[tagFill].push({'div data-ds="sub"': model.subjects});
			if (model.message) result[tagFill].push({'div data-ds="msg"': model.message});
			if (model.notes) result[tagFill].push({'div data-ds="not"': model.notes});

			return result;
		},
		axis: function(attributes = {}, model) {
			if (Array.isArray(attributes)) {
				model = attributes;
				attributes = {};
			}

			let tagFill = ('div data-ds="axis" ' +  _toAttributesString(attributes));
			let result = {};
			let items = (Array.isArray(model) ? model : model.items) || [];

			result[tagFill] = items;
			
			return result;
		},
		wrap: function(attributes = {}, item = true) {
			if (('object' != typeof attributes) || Array.isArray(attributes)) {
				item = attributes;
				attributes = {};
			}

			let tagFill = ('div data-ds="wrap" ' +  _toAttributesString(attributes));
			let result = {};

			result[tagFill] = item;

			return result;
		},
		list: function(attributes = {}, secondaryAttributes = {}, model) {
			if (Array.isArray(attributes)) {
				model = attributes;
				attributes = {};
			}

			let listTag = model.listTag || 'ul';
			let itemTag = ('div' == listTag) ? (model.listItemTag || 'div') : 'li';
			let tagFill = (listTag + ' data-ds="list" ' +  _toAttributesString(attributes));
			let result = {};
			let items = (Array.isArray(model) ? model : model.items) || [];

			result[tagFill] = items.map(item => {
				let obj = {};
				obj[itemTag + ' data-ds="item" ' +  _toAttributesString(secondaryAttributes)] = item;

				return obj;
			});

			return result;
		},
		grid: function(attributes = {}, secondaryAttributes = {}, model) {
			if (Array.isArray(attributes)) {
				model = attributes;
				attributes = {};
				secondaryAttributes = {};
			}

			if (typeof attributes.style === 'object') {
				Object.assign(attributes.style, { display: 'grid' });
			} else {
				attributes.style = (attributes.style || '') + '; display: grid;';
			}

			let tagFill = ('div data-ds="grid" ' +  _toAttributesString(attributes));
			let result = {};
			let items = (Array.isArray(model) ? model : model.items) || [];

			result[tagFill] = items.map(item => {
				return fanstatic.tagFillContains(item, 'data-ds="cell"') 
					? item
					: { ['div data-ds="cell" ' +  _toAttributesString(secondaryAttributes)]: item };
			});

			return result;
		},
		button: function(attributes = {}, model) {
			if (('object' != typeof attributes) || Array.isArray(attributes)) {
				model = attributes;
				attributes = {};
			}

			let tagFill = `button data-ds="button"`;

			return {[tagFill]: model};
		},
		placeholder: function(name, model = true) {
			let tagFill = `div data-ds-placeholder="${name}"`;
			
			return {[tagFill]: model}
		},
		sanitize: function(val, rules = null) {
			if (Array.isArray(val)) {
				for (let i in val) {
					this.sanitize(val[i], rules);
				}
			}
			else if (val !== null && typeof val == 'object') {
				const keys = Object.keys(val);
			
				for (let k of keys) {
					if (typeof val[k] == 'string') {
						const ruled = rules ? rules(k, val[k]) : false;

						val[k] = ruled || fanstatic.sanitizeHtml(val[k]);
					}
					else {
						this.sanitize(val[k], rules);
					}
				}
			}
		},
	};
	
	window.dispatchEvent(new CustomEvent('fanstatic.design.load', {
		detail: fanstatic.design
	}));
}
