{
	fanstatic.assignClassfix({
		/* general */

		'main > section': 'panel-section',
		'.panel-section [data-pn-panel="block.section-block"]': 'panel-section-block',

		/* section */
		
		'[data-pn-role=container]': 'theme-container',
		'[data-pn-scope="section.containerized-hero"][data-pn-panel^="block"]': 'panel-hero-block',
		'[data-pn-scope="section.containerized-hero"][data-ds=unit]': 'theme-hero-block',

		'[data-pn-scope="section.containerized-stack"] [data-pn-role=items]': 'panel-section-stack-items',

		/* block */

		'[data-pn-panel="block.basic-block"]': 'panel-block-basic-block',

		/* card */

		'[data-pn-panel="card.rating"]': 'panel-card-rating',
		'[data-pn-panel="card.quote"]': 'panel-card-quote',
		'[data-pn-panel="card.post"]': 'panel-card-post',
		'[data-pn-panel="card.profile"]': 'panel-card-profile',
		'[data-pn-panel="card.highlight"]': 'panel-card-highlight',
	});
}
