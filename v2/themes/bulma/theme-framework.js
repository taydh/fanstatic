{
	/* BULMA related classfixes */

	fanstatic.assignClassfix({
		/* general */
		'[data-pn-role|="button"]': 'button',

		'[class|="panel-card"]': 'card',
		'[class|="panel-card"] > [data-ds=cap]': 'image',

		'.panel-card-highlight > [data-ds=head]': 'card-content',
		'.panel-card-highlight > [data-ds=body]': 'card-content',

		'.panel-card-post > [data-ds=head]': 'card-content',
		'.panel-card-post > [data-ds=body]': 'card-content',
		'.panel-card-post > [data-ds=head] > [data-pn-role=title]': 'title is-4',
		'.panel-card-post > [data-ds=head] > [data-pn-role=section]': 'subtitle is-6',
		'.panel-card-post > [data-ds=head] > [data-pn-role=date]': 'subtitle is-6',
		'.panel-card-post > [data-ds=foot]': 'card-content has-text-centered',

		'.panel-card-profile > [data-ds=head]': 'card-content',
		'.panel-card-profile > [data-ds=body]': 'card-content',
		'.panel-card-profile > [data-ds=foot]': 'card-content',
		'.panel-card-profile > [data-ds=head] > [data-pn-role=name]': 'title is-4',
		'.panel-card-profile > [data-ds=head] > [data-pn-role=title]': 'subtitle is-6',
		'.panel-card-profile > [data-ds=foot] > [data-ds=axis]': 'is-flex is-justify-content-center',
	});
}
