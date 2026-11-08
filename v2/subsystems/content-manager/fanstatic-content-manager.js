class Fanstatic_ContentManager
{
	#baseUrl = '/';
	#contentBaseUrl = '';

	#pages = {};
	#posts = [];
	#authors = [];
	#categories = [];
	#tags = [];

	constructor(settings)
	{
		if (settings.pages && typeof(settings.pages) === 'object') {
			Object.assign(this.#pages, settings.pages);
		}

		if (Array.isArray(settings.posts)) {
			const tagSet = new Set();

			settings.posts.forEach(post => {
				this.#posts.push(post);

				if (post.tags) {
					post.tags.split(' ').forEach(tag => {
						if (tag.length > 0) {
							tagSet.add(tag);
						}
					})
				}
			});

			this.#tags = Array.from(tagSet);
		}

		if (settings.authors && typeof(settings.authors) === 'object') {
			Object.assign(this.#authors, settings.authors);
		}

		if (settings.categories && typeof(settings.categories) == 'object') {
			Object.assign(this.#categories, settings.categories);
		}

		this.#baseUrl = settings.baseUrl;
		this.#contentBaseUrl = settings.contentBaseUrl;
	}

	get baseUrl() { return this.#baseUrl; }
	get contentBaseUrl() { return this.#contentBaseUrl; }
	get pages() { return this.#pages; }
	get posts() { return this.#posts; }
	get categories() { return this.#categories; }
	get authors() { return this.#authors; }
	get tags() { return this.#tags; }

	resolveSlug(baseUrl = null, url = null) {
		url = url || window.location.href;
		baseUrl = baseUrl || this.#baseUrl || url;

		let u, b;
		try {
			u = new URL(url);
		} catch {
			throw new Error(`Malformed url: ${url}`);
		}
		try {
			b = new URL(baseUrl);
		} catch {
			throw new Error(`Malformed baseUrl: ${baseUrl}`);
		}

		if (u.origin !== b.origin) {
			throw new Error(`Origin mismatch: ${u.origin} !== ${b.origin}`);
		}

		const basePath = b.pathname.replace(/\/+$/, '') + '/';
		if (!u.pathname.startsWith(basePath)) return '';

		const [first] = u.pathname.slice(basePath.length).split('/').filter(Boolean);
		if (!first) return '';

		try {
			return decodeURIComponent(first);
		} catch {
			throw new Error(`Malformed slug encoding: ${first}`);
		}
	}

	resolvePageContentTemplateUrl(slug) {
		const page = this.#pages[slug];

		return this.#contentBaseUrl + '/pages/' + fanstatic.toKebabCase(slug) + '.md';
	}

	resolvePostContentTemplateUrl(id) 
	{
		const post = this.#posts[this.getPostIndex(id)];
		const postDate = new Date(post.date);

		return this.#contentBaseUrl + '/posts/' + postDate.getFullYear() + '/' + post.id + '-' + fanstatic.toKebabCase(post.title) + '.md';
	}

	resolvePostId() {
		const url = new URL(window.location.href);

		if (url.searchParams.has('id')) {
			return url.searchParams.get('id');
		}
		else {
			return null;
		}
	}

	resolvePostUrl(id) {
		const postIndex = this.getPostIndex(id);
		const post = this.#posts[postIndex];
		const postDate = new Date(post.date);
		const kebabCaseTitle = fanstatic.toKebabCase(post.title)
		const url = this.#baseUrl + `/posts/${fanstatic.toYMD(postDate)}-${kebabCaseTitle}?id=${id}`;

		return url;
	}

	resolveCategoryUrl(category) {
		const url = this.#baseUrl + `/categories/#is-${category}`;

		return url;
	}

	resolveAuthorUrl(author) {
		const url = this.#baseUrl + `/authors/#is-${author}`;

		return url;
	}

	resolveTagUrl(tag) {
		const url = this.#baseUrl + `/tags/#is-${tag}`;

		return url;
	}

	getPostEntries (page=1, opt = {}) {
		let result = [];
		let count = 0;

		const limit = opt.limit || 20;
		const filter = opt.filter || {};
		const sort = opt.sort || {};

		// filter here
		result = this.#posts.filter(post => {
			const f1 = (filter.category ? post.category == filter.category : true);
			const f2 = (filter.author ? post.author == filter.author : true);
			const f3 = (filter.tag ? post.tags.split(' ').includes(filter.tag) : true);

			return f1 && f2 && f3;
		});

		// for (let e of this.#posts) {
		// 	// skipping
		// 	if (count++ < (limit * (page - 1))) continue;

		// 	// filter here
		// 	result.push(e)

		// 	if (count == (limit * page)) {
		// 		break;
		// 	}
		// }

		return result;
	}

	getPostIndex(id) {
		return this.#posts.findIndex(post => post.id == id);
	}
}