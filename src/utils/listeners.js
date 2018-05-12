class Listeners {
	constructor() {
		this.changeCallbacks_ = [];
		this.ppsspp_ = null;
		this.connected_ = false;
	}

	init(ppsspp) {
		this.ppsspp_ = ppsspp;
	}

	// Change the active connection.
	change(connected) {
		this.connected_ = connected;
		for (let callback of this.changeCallbacks_) {
			callback(connected);
		}
	}

	onConnectionChange(callback) {
		this.changeCallbacks_.push(callback);
		return {
			remove: () => {
				const index = this.changeCallbacks_.indexOf(callback);
				if (index !== -1) {
					this.changeCallbacks_.splice(index, 1);
				}
			},
		};
	}

	onConnection(callback) {
		const changeCallback = (connected) => {
			if (connected) {
				callback(true);
			}
		};
		if (this.connected_) {
			callback(true);
		}

		return this.onConnectionChange(changeCallback);
	}

	// Listen for events (and re-register as necessary.)
	listen(handlers) {
		let result = [];
		for (let name in handlers) {
			if (handlers.hasOwnProperty(name)) {
				let listener;
				if (name === 'connection') {
					listener = this.onConnection(handlers[name]);
				} else if (name === 'connection.change') {
					listener = this.onConnectionChange(handlers[name]);
				} else {
					listener = this.ppsspp_.listen(name, handlers[name]);
				}
				result.push(listener);
			}
		}
		return result;
	}

	forget(listeners) {
		for (let listener of listeners) {
			listener.remove();
		}
	}
}

const listeners = new Listeners();
export default listeners;
