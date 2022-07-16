import listeners from '../utils/listeners.js';

export function setAutoPersistBreakpoints(flag) {
	if (flag) {
		localStorage.ppdbg_persist_breakpoints = '1';
	} else {
		delete localStorage.ppdbg_persist_breakpoints;
	}
}

export function isAutoPersistingBreakpoints() {
	try {
		return localStorage.ppdbg_persist_breakpoints === '1';
	} catch {
		return false;
	}
}

export function cleanBreakpointForPersist(data) {
	return {
		...data,
		// These are informational.
		code: undefined,
		symbol: undefined,
		hits: undefined,
		// Can't send nulls, so remove here.
		condition: data.condition === null ? undefined : data.condition,
		logFormat: data.logFormat === null ? undefined : data.logFormat,
	};
}

class BreakpointPersister {
	ppsspp_;
	updateTimeouts_ = {};
	listeners_ = null;
	gameID_ = null;

	init(ppsspp) {
		this.ppsspp_ = ppsspp;
		this.listeners_ = listeners.listen({
			'game.start': ({ game }) => this.applySaved(game),
			'game.status': ({ game }) => this.applySaved(game),
			'game.quit': () => this.gameID_ = null,
			'cpu.breakpoint.add': () => this.scheduleUpdate('cpu'),
			'cpu.breakpoint.update': () => this.scheduleUpdate('cpu'),
			'cpu.breakpoint.remove': () => this.scheduleUpdate('cpu'),
			'memory.breakpoint.add': () => this.scheduleUpdate('memory'),
			'memory.breakpoint.update': () => this.scheduleUpdate('memory'),
			'memory.breakpoint.remove': () => this.scheduleUpdate('memory'),
			'cpu.breakpoint.list': ({ breakpoints }) => this.processUpdate('cpu', breakpoints),
			'memory.breakpoint.list': ({ breakpoints }) => this.processUpdate('memory', breakpoints),
		});
	}

	shutdown() {
		listeners.forget(this.listeners_);
		this.listeners_ = null;
	}

	applySaved(game) {
		if (!isAutoPersistingBreakpoints() || !game.id) {
			return;
		}

		this.gameID_ = game.id;

		this.restoreBreakpoints('cpu');
		this.restoreBreakpoints('memory');
	}

	restoreBreakpoints(type) {
		if (!isAutoPersistingBreakpoints() || !this.gameID_) {
			return;
		}

		const key = 'ppdbg_breakpoints_' + type + '_' + this.gameID_;
		try {
			const list = JSON.parse(localStorage[key]);
			for (let bp of list) {
				this.ppsspp_.send({
					event: type === 'cpu' ? 'cpu.breakpoint.add' : 'memory.breakpoint.add',
					...bp,
				}).then(() => null, (err) => {
					console.error('Unable to restore breakpoint', err);
				});
			}
		} catch (err) {
			console.error('Unable to restore breakpoints', err);
		}
	}

	scheduleUpdate(type) {
		if (!isAutoPersistingBreakpoints() || !this.gameID_) {
			return;
		}
		// Already scheduled?  Leave it.
		if (this.updateTimeouts_[type]) {
			return;
		}

		// Let's try to debounce updates in case it's immediately listed by a component.
		this.updateTimeouts_[type] = setTimeout(() => {
			// Ignore the result - our listener will handle it.
			this.ppsspp_.send({
				event: type === 'cpu' ? 'cpu.breakpoint.list' : 'memory.breakpoint.list',
			}).then(() => null, () => null);
			delete this.updateTimeouts_[type];
		}, 100);
	}

	processUpdate(type, breakpoints) {
		if (!isAutoPersistingBreakpoints() || !this.gameID_) {
			return;
		}

		const key = 'ppdbg_breakpoints_' + type + '_' + this.gameID_;
		try {
			// Store, but remove some properties it's not useful to persist.
			localStorage[key] = JSON.stringify(breakpoints.map(cleanBreakpointForPersist));
		} catch (err) {
			console.error('Unable to save breakpoints', err);
		}
	}
}

export const breakpointPersister = new BreakpointPersister();
