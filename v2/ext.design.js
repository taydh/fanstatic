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
		
		/* raw flex elements for mobile screen, use class or style for most cases */
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
