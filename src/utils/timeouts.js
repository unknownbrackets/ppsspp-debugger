export class Timeout {
	handle;
	func;
	ms;

	constructor(func, ms) {
		this.func = func;
		this.ms = ms;
	}

	start() {
		this.cancel();
		this.handle = setTimeout(() => {
			this.handle = null;
			this.func();
		}, this.ms);
	}

	reset(func) {
		this.func = func;
	}

	runEarly() {
		if (this.handle) {
			this.cancel();
			this.func();
		}
	}

	cancel() {
		if (this.handle !== null) {
			clearTimeout(this.handle);
			this.handle = null;
		}
	}
}
