{
	fanstatic.assignClassfix({
		/* general */

		'main > section': 'theme-section',
		'.panel-section [data-pn-panel="block.section-block"]': 'panel-section-block',

		/* section */
		
		'[data-pn=container]': 'theme-container',
		'[data-pn-scope="section.containerized-hero"][data-pn-panel^="block"]': 'panel-hero-block',
		'[data-pn-scope="section.containerized-hero"][data-ds=unit]': 'theme-hero-block',

		'[data-pn-scope="section.containerized-stack"] [data-pn=items]': 'theme-section-stack-items',

		/* block */

		'[data-pn-panel="block.basic-block"]': 'panel-block-basic-block',

		/* card */

		'[data-pn-panel="card.rating"]': 'theme-card-rating',
		'[data-pn-panel="card.quote"]': 'theme-card-quote',
		'[data-pn-panel="card.post"]': 'theme-card-post',
		'[data-pn-panel="card.profile"]': 'theme-card-profile',
		'[data-pn-panel="card.highlight"]': 'theme-card-highlight',

		'[data-pn-panel="block.content-block"]': 'theme-content',
		'[data-pn-panel="block.content-block"] > [data-pn=header] > [data-pn=context]': 'theme-content-context',
		'[data-pn-panel="block.content-block"] > [data-pn=header] > [data-pn=title]': 'theme-content-title',
		'[data-pn-panel="block.content-block"] > [data-pn=header] > [data-pn=subtitle]': 'theme-content-subtitle',
		'[data-pn-panel="block.content-block"] > [data-pn=header] > [data-pn=caption]': 'theme-content-caption',
		'[data-pn-panel="block.content-block"] > [data-pn=content]': 'theme-content-content',
		'[data-pn-panel="block.content-block"] > [data-pn=footnote]': 'theme-content-footnote',

		'[data-pn-panel="block.actionable-block"]': 'theme-actionable',
		'[data-pn-panel="block.actionable-block"] > [data-pn=subjects]': 'theme-actionable-subjects',
		'[data-pn-panel="block.actionable-block"] > [data-pn=message]': 'theme-actionable-message',
		'[data-pn-panel="block.actionable-block"] > [data-pn=actions]': 'theme-actionable-actions',
	});
}
