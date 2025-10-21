{
	const _toStyleAttributesString = function(attributes) {
		return Object.entries(attributes).map(([k,v]) => `${k}:${v}`).join(';');
	}

	const _toDataAttributesString = function(attributes) {
		return Object.entries(attributes).map(([k,v]) => `data-${k}="${v}"`).join(' ');
	}

	const _toAttributesString = function(attributes) {
		return Object.entries(attributes).map(([k,v]) => {
			if ('data' === k && typeof v === 'object') {
				return _toDataAttributesString(v);
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
			let result = {};

			result[tagFill] = items;

			return result;
		},
		unit: function(model, attributes = {}) {
			let tagFill = ('div data-design="unit" ' + _toAttributesString(attributes));
			let result = {};

			result[tagFill] = [];

			if (model.head) result[tagFill].push({'div data-design="unit-head"': model.head});
			if (model.body) result[tagFill].push({'div data-design="unit-body"': model.body});
			if (model.foot) result[tagFill].push({'div data-design="unit-foot"': model.foot});

			return result;
		},
		axis: function(model, attributes = {}) {
			let tagFill = ('div data-design="axis" ' +  _toAttributesString(attributes));
			let result = {};

			result[tagFill] = Array.isArray(model) ? model : model.items;

			return result;
		},
		wrap: function(item, attributes = {}) {
			let tagFill = ('div data-design="wrap" ' +  _toAttributesString(attributes));
			let result = {};

			result[tagFill] = item;

			return result;
		},
		list: function(model, attributes = {}, secondaryAttributes = {}) {
			let listTag = model.type || 'ul';
			let itemTag = ('div' == listTag) ? 'div' : 'li';
			let tagFill = (listTag + ' data-design="list" ' +  _toAttributesString(attributes));
			let result = {};
			let items = (Array.isArray(model) ? model : model.items) || [];

			result[tagFill] = items.map(item => {
				let obj = {};
				obj[itemTag + ' data-design="list-item" ' +  _toAttributesString(secondaryAttributes)] = item;

				return obj;
			});

			return result;
		},
		axisFlex: function(model, attributes = {}) {
			if (!attributes.style) attributes.style = {};

			if (typeof attributes.style === 'object') {
				Object.assign(attributes.style, { display: 'flex' });
			} else {
				attributes.style = (attributes.style || '') + 'display:flex';
			}

			return this.axis(model, attributes);
		},
		unitFlex: function(model, attributes = {}) {
			if (!attributes.style) attributes.style = {};

			if (typeof attributes.style === 'object') {
				Object.assign(attributes.style, { display: 'flex' });
			} else {
				attributes.style = (attributes.style || '') + 'display:flex';
			}

			let tagFill = ('div data-design="unit" ' + _toAttributesString(attributes));
			let result = {};

			result[tagFill] = [];

			if (model.head) result[tagFill].push({'div data-design="unit-head"': model.head});
			if (model.body) result[tagFill].push({'div data-design="unit-body" style="flex:1"': model.body});
			if (model.foot) result[tagFill].push({'div data-design="unit-foot"': model.foot});

			return result;
		},
		grid: function(model, attributes = {}, secondaryAttributes = {}) {
			let tagFill = ('div data-design="grid" ' +  _toAttributesString(attributes));
			let result = {};
			let items = (Array.isArray(model) ? model : model.items) || [];

			result[tagFill] = items.map(item => {
				let obj = {};
				obj[itemTag + ' data-design="grid-cell" ' +  _toAttributesString(secondaryAttributes)] = item;

				return obj;
			});

			return result;
		},
		placeholder: function(name) {
			let tagFill = `i data-design-placeholder="${name}"`;
			let result = {}

			result[tagFill] = true;

			return result;
		},
	};
	
	window.dispatchEvent(new CustomEvent('fanstatic.design.load', {
		detail: fanstatic.design
	}));
}
