class Fanstatic_LandingManager {
	constructor(pageSettings) {
		this._pageMap = pageMap || {}
	}

	count() {
		return this._array.length
	}

	index(slug) {
		let found = null

		for (let i=0; i < this._array.length; i++) {
			if (this._array[i]?.slug == slug) {
				found = i;
				break;
			}
		}

		return found
	}
}
