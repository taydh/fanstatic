{
	/* BULMA framework classfixes */

	fanstatic.assignClassfix({
		/* general */

		'[data-pn-role|="button"]': 'button',

		/* cards */

		'[class|="theme-card"]': 'card',
		'[class|="theme-card"] > [data-pn-role=cap]': 'image',

		'.theme-card-highlight > [data-pn-role=head]': 'card-content',
		'.theme-card-highlight > [data-pn-role=body]': 'card-content',

		'.theme-card-post > [data-pn-role=head]': 'card-content',
		'.theme-card-post > [data-pn-role=body]': 'card-content',
		'.theme-card-post > [data-pn-role=head] > [data-pn-role=title]': 'title is-4',
		'.theme-card-post > [data-pn-role=head] > [data-pn-role=section]': 'subtitle is-6',
		'.theme-card-post > [data-pn-role=head] > [data-pn-role=date]': 'subtitle is-6',
		'.theme-card-post > [data-pn-role=foot]': 'card-content has-text-centered',

		'.theme-card-profile > [data-ds=head]': 'card-content',
		'.theme-card-profile > [data-ds=body]': 'card-content',
		'.theme-card-profile > [data-ds=foot]': 'card-content',
		'.theme-card-profile > [data-ds=head] > [data-pn-role=name]': 'title is-4',
		'.theme-card-profile > [data-ds=head] > [data-pn-role=title]': 'subtitle is-6',
		'.theme-card-profile > [data-ds=foot] > [data-ds=axis]': 'is-flex is-justify-content-center',
	});
}
