{
	const _toAttributesString = function(attributes) {
		return Object.entries(attributes).map(([k,v]) => `${k}="${v}"`).join();
	}

	fanstatic.design = {
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
		wrapper: function(model, attributes = {}) {
			let tagFill = ('div data-design="wrapper" ' +  _toAttributesString(attributes));
			let result = {};

			result[tagFill] = Array.isArray(model) ? model : model.items;

			return result;
		},
		container: function(model, attributes = {}) {
			let tagFill = ('div data-design="container" ' +  _toAttributesString(attributes));
			let result = {};

			result[tagFill] = Array.isArray(model) ? model : model.items;

			return result;
		},
	};
	
	window.dispatchEvent(new CustomEvent('fanstatic.design.load', {
		detail: fanstatic.design
	}));
}
