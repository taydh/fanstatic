var fanstatic_cms = {
	settings: {},
	resolveSlug: function(){
		const slug = fanstatic.getBasePath().replace(/^\/+|\/+$/gm,'');

		//==
		console.log('[slug]', slug)
		//==

		return slug;
	},

	render: async function() {
		console.log('[rendering CMS mode]')

		const slug = this.resolveSlug()
		var content = null
		var contentType = ''
		var contentDefaultLayout = '_default_'
		var contentSelector = {
			page: { list: this.settings.pages, layout: '_page_' },
			tag: { list: this.settings.tags, layout: '_tag_' },
			author: { list: this.settings.tags, layout: '_author_' },
			post: { list: this.settings.posts, layout: '_post_' },
		}

		/* finding content from slug */
		for (let type in contentSelector) {
			contentType = type;
			contentDefaultLayout = this.settings.layouts[contentSelector[type].layout] 
				? contentSelector[type].layout
				: contentDefaultLayout;

			content = Array.isArray(contentSelector[type].list) 
				? contentSelector[type].list.find(i => i.slug == slug)
				: Object.values(contentSelector[type].list).find(i => i.slug == slug)
				
			if (content) break;
		}

		console.log('/content/', contentType, contentSelector[contentType].layout, content)

		if (!content) {
			console.error('[content not found, might be a wrong slug setting]')
			return
		}

		/* render content from associated layout */
		var contentLayout		
		var layoutData = {};

		if (content) {
			contentLayout = content.layout || contentDefaultLayout;
			layoutData = this.settings.layouts[contentLayout].data
		}

		if (contentType == 'post') {
			layoutData = Object.assign(layoutData, {
				contentType: contentType,
				post_entry: content
			});
		}
		else if (contentType == 'page') {
			layoutData = Object.assign(layoutData, {
				contentType: contentType,
				page_entry: content
			});
		}
		else if (contentType == 'tag') {
			layoutData = Object.assign(layoutData, {
				contentType: contentType, 
				posts: this.settings.posts.find(i => i.tags ? i.tags.includes(content.name) : false)
			});
		}

		const container = document.body.querySelector(this.settings.layout_container);
		var tmp_containerDisplayStyle = container.style.display
		container.style.display = 'none'

		await fanstatic.prepend(
			container, 
			this.settings.layouts[contentLayout].url, {
				data: layoutData,
				renderer: this.settings.layouts[contentLayout].renderer
			});

		container.style.display = tmp_containerDisplayStyle
	}
}