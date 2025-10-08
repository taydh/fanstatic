class Fanstatic_PostManager {
	constructor(entries, opt) {
		this._opt = opt || {}
		this._array = entries || []
		this._entries = this._opt.mutator ? entries.map(this._opt.mutator) : entries;
	}

	entries(limit=20, page=1, filters=[], sort=[]) {
		var result = []
		var count = 0;

		// sort here

		for (let e of this._entries) {
			// filter here
			result.push(e)

			if (++count == limit) {
				break;
			}
		}

		return result;
	}

	count() {
		return this._entries.length;
	}

	index(slug) {
		if (!slug) return null;

		let result = null

		for (let i=0; i < this._entries.length; i++) {
			if (this._entries[i]?.slug == slug) {
				result = i;
				break;
			}
		}

		return result;
	}

	entry(index) {
		return this._entries[index];
	}

	prevIndex(index) {
		return index == 0 ? null : this._entries[index - 1];
	}

	nextIndex(index) {
		return index == this._entries.length - 1 ? null : this._entries[index + 1];
	}

	tags() {
		let result = new Set()

		for (let i=0; i < this._entries.length; i++) {
			(this._entries[i].tags || '').split(',').forEach(v => {
				if (v != '') result.add(v.toLowerCase().trim())
			})
		}

		return Array.from(result);
	}

	months() {
		let years = {};
		let pubDate, y, m;
		let result = []

		for (let i=0; i < this._entries.length; i++) {
			pubDate = new Date(this._entries[i].pub_date)
			y = pubDate.getFullYear();

			if (!years.hasOwnProperty(y.toString())) {
				years[y.toString()] = new Set();
			}

			years[y.toString()].add(pubDate.getMonth())
		}

		for (y of Object.keys(years)) {
			result.push({
				year: y,
				months: Array.from(years[y])
			})
		}

		return result;
	}
}
