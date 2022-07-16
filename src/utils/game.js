import listeners from '../utils/listeners.js';

/**
 * @typedef GameStatusValues
 * @property {boolean} connected Whether a connection to PPSSPP is active.
 * @property {boolean} stepping Whether CPU is in stepping / break mode.
 * @property {boolean} paused Whether game emulation is paused.
 * @property {boolean} started Whether game emulation has been started yet.
 * @property {number} pc Integer PC value, or 0.
 * @property {number} currentThread Thread ID of active thread or undefined.
 * @property {Function} setState Method to update state.
 */

class GameStatus {
	/**
	 * @type {GameStatusValues}
	 */
	state = {
		id: null,
		connected: false,
		stepping: false,
		paused: true,
		started: false,
		pc: 0,
		currentThread: undefined,
		setState: undefined,
	};
	stateListeners = [];
	listeners_;
	ppsspp_;

	init(ppsspp) {
		this.state.setState = values => {
			this.setState(values);
		};

		this.ppsspp_ = ppsspp;
		this.listeners_ = listeners.listen({
			'connection': () => this.onConnection(),
			'connection.change': (connected) => this.onConnectionChange(connected),
			'cpu.stepping': (data) => this.onStepping(data),
			'cpu.resume': () => this.setState({ stepping: false }),
			'game.start': ({ game }) => {
				this.setState({ id: game && game.id, started: true, paused: false });
			},
			'game.status': ({ game }) => {
				this.setState({ id: game && game.id });
			},
			'game.quit': () => {
				this.setState({
					started: false,
					stepping: false,
					paused: true,
					pc: 0,
					currentThread: undefined,
				});
			},
			'game.pause': () => this.setState({ paused: true }),
			'game.resume': () => this.setState({ paused: false }),
			'cpu.setReg': (result) => {
				if (result.category === 0 && result.register === 32) {
					this.setState({ pc: result.uintValue });
				}
			},
			'cpu.getAllRegs': (result) => {
				const pc = result.categories[0].uintValues[32];
				this.setState({ pc });
			},
		});
	}

	shutdown() {
		listeners.forget(this.listeners_);
		this.listeners_ = null;
	}

	onConnectionChange(connected) {
		// On any reconnect, assume paused until proven otherwise.
		this.setState({ connected, started: false, stepping: false, paused: true });
		if (!connected) {
			this.setState({ currentThread: undefined });
		}
	}

	onConnection() {
		// Update the status of this connection immediately too.
		this.ppsspp_.send({ event: 'cpu.status' }).then((result) => {
			const { stepping, paused, pc } = result;
			const started = pc !== 0 || stepping;

			this.setState({ connected: true, started, stepping, paused, pc });
		}, (err) => {
			this.setState({ stepping: false, paused: true });
		});
	}

	onStepping(data) {
		this.setState({
			stepping: true,
			pc: data.pc,
		});
	}

	listenState(callback) {
		this.stateListeners.push(callback);
	}

	setState(values) {
		let changed = false;
		for (let k in values) {
			if (values[k] !== this.state[k]) {
				changed = true;
			}
		}

		if (changed) {
			this.state = { ...this.state, ...values };
			for (let callback of this.stateListeners) {
				callback(this.state);
			}
		}
	}
}

export default GameStatus;
