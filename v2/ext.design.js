{
	fanstatic.design = {
		wrapper: function(model, attributes = {}) {
			let tagFill = ('div ' + Object.entries(attributes).map(([k,v]) => `${k}="${v}"`).join()) + ' data-design="wrapper"';
			let result = {};

			result[tagFill] = Array.isArray(model) ? model : model.items;

			return result;
		},
		unit: function(model, attributes = {}) {
			let tagFill = ('div ' + Object.entries(attributes).map(([k,v]) => `${k}="${v}"`).join()) + ' data-design="unit"';
			let result = {};

			result[tagFill] = [];

			if (model.head) result[tagFill].push({'div data-design="unit-head"': model.head});
			if (model.body) result[tagFill].push({'div data-design="unit-body"': model.body});
			if (model.foot) result[tagFill].push({'div data-design="unit-foot"': model.foot});

			return result;
		},
		axis: function(model, attributes = {}) {
			let tagFill = ('div ' + Object.entries(attributes).map(([k,v]) => `${k}="${v}"`).join()) + ' data-design="axis"';
			let result = {};

			result[tagFill] = Array.isArray(model) ? model : model.items;

			return result;
		},
	};
	
	window.dispatchEvent(new CustomEvent('fanstatic.design.load', {
		detail: fanstatic.design
	}));
}
