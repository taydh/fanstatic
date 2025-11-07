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
		unit: function(attributes = {}, model) {
			if (!model && Object.keys(attributes).some(k => 'head' == k || 'body' == k || 'foot' == k)) {
				model = attributes;
				attributes = {};
			}

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

			if (model.cap) result[tagFill].push({'div data-ds-sub="unit_cap"': model.cap});
			if (model.head) result[tagFill].push({'div data-ds-sub="unit_head"': model.head});
			if (model.body) result[tagFill].push({'div data-ds-sub="unit_body"': model.body});
			if (model.foot) result[tagFill].push({'div data-ds-sub="unit_foot"': model.foot});

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
				obj[itemTag + ' data-ds-sub="list_item" ' +  _toAttributesString(secondaryAttributes)] = item;

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
				attributes.style = (attributes.style || '') + ';display:grid;';
			}

			let tagFill = ('div data-ds="grid" ' +  _toAttributesString(attributes));
			let result = {};
			let items = (Array.isArray(model) ? model : model.items) || [];

			result[tagFill] = items.map(item => {
				return fanstatic.tagFillContains(item, 'data-ds-sub="grid_cell"') 
					? item
					: { ['div data-ds-sub="grid_cell" ' +  _toAttributesString(secondaryAttributes)]: item };
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
		placeholder: function(name) {
			let tagFill = `i data-ds-placeholder="${name}"`;
			
			return {[tagFill]: true}
		},
		
		/* raw flex elements for mobile screen, use class or style for most cases */
		unitFlex: function(attributes = {}, model) {
			if (!model && Object.keys(attributes).some(k => 'head' == k || 'body' == k || 'foot' == k)) {
				model = attributes;
				attributes = {};
			}

			if (!attributes.style) attributes.style = {};

			if (typeof attributes.style === 'object') {
				Object.assign(attributes.style, { display: 'flex' });
			} else {
				attributes.style = (attributes.style || '') + ';display:flex;';
			}

			const unit = this.unit(attributes, model);

			if (model.body) {
				Object.entries(unit)[0][1].forEach(el => { 
					const entry = Object.entries(el)[0];

					if(entry[0].includes('data-ds="unit_body"')) {
						el[entry[0] + ' style="flex:1"'] = entry[1];
						delete el[entry[0]];
					}
				})
			}

			return unit;
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
