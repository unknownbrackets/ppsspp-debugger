// PPSSPP debugger API client
//
// Most operations use promises and are asynchronous.
//
// Example usage:
//
//    let ppsspp = new PPSSPP();
//    ppsspp.listen('cpu.stepping', function () {
//        console.log('Hit a breakpoint');
//    });
//    ppsspp.autoConnect().then(function () {
//        return ppsspp.send({ event: 'cpu.getReg', name: 'pc' });
//    }).then(function (result) {
//        console.log('pc: ', result.uintValue);
//    }).catch(function (err) {
//        console.log('Something went wrong', err);
//    });
//
// Methods:
//  - autoConnect(): Find and connect to PPSSPP automatically.  Returns a promise.
//  - connect(uri): Connect to a specific WebSocket URI (begins with ws://.)  Returns a promise.
//  - disconnect(): Disconnect from PPSSPP.  No return.
//  - listen(name, handler): Adds a listener for unsolicited events (e.g. 'log') or '*' for all.  No return.
//      The handler takes one parameter, the data object.
//  - send(object): Send an event to PPSSPP.  Returns a promise resolving to the data object.
//      Note that not all PPSSPP events have a response.  You may receive null or it may never resolve.
//
// Properties:
//  - onError: Set this to a function receiving (message, level) for errors.
//  - onClose: Set this to a function with no parameters called when on disconnect.
//
// For documentation on the actual events for send() and listen(), look in PPSSPP's source code.
// Start with the comment in Core/Debugger/WebSocket.cpp.
// Individual files in Core/Debugger/WebSocket/ also have comments describing the events and parameters.

// We fast-resolve these to avoid confusion.
const NoResponseEvents = [
	'cpu.stepping',
	'cpu.resume',
];

const ErrorLevels = {
	NOTICE: 1,
	ERROR: 2,
	WARN: 3,
	INFO: 4,
	DEBUG: 5,
	VERBOSE: 6,
};

const PPSSPP_MATCH_API = 'http://report.ppsspp.org/match/list';
const PPSSPP_SUB_PROTOCOL = 'debugger.ppsspp.org';
const PPSSPP_DEFAULT_PATH = '/debugger';

export default class PPSSPP {
	autoConnect() {
		if (this.socket_ !== null) {
			return Promise.reject(new Error('Already connected, disconnect first'));
		}

		let err = new Error('Couldn\'t connect');

		return fetch(PPSSPP_MATCH_API).then((response) => {
			return response.json();
		}).then((listing) => {
			return this.tryNextEndpoint_(listing);
		}).then(this.setupSocket_.bind(this), specificError => {
			err.message = specificError.message;
			err.originalError = specificError;
			throw err;
		});
	}

	connect(uri) {
		if (this.socket_ !== null) {
			return Promise.reject(new Error('Already connected, disconnect first'));
		}

		// In case it fails, prepare the error (and stack trace) now.
		let err = new Error('Couldn\'t connect to ' + uri);

		return new Promise((resolve, reject) => {
			const possibleSocket = new WebSocket(uri, PPSSPP_SUB_PROTOCOL);

			possibleSocket.onopen = () => {
				this.socket_ = possibleSocket;
				resolve();
			};
			possibleSocket.onclose = () => {
				reject(err);
			};
		}).then(this.setupSocket_.bind(this));
	}

	disconnect() {
		if (this.socket_ === null) {
			throw new Error('Not connected');
		}

		this.failAllPending_('Disconnected from PPSSPP');

		this.socket_.close(1000);
		this.socket_ = null;
	}

	listen(eventName, handler) {
		if (!(eventName in this.listeners_)) {
			this.listeners_[eventName] = [];
		}

		this.listeners_[eventName].push(handler);

		return {
			remove: () => {
				const list = this.listeners_[eventName];
				const index = list.indexOf(handler);
				if (index !== -1) {
					list.splice(index, 1);
				}
			},
		};
	}

	send(data) {
		if (this.socket_ === null) {
			return Promise.reject(new Error('Not connected'));
		}

		// Prepare a stack trace now, not when resolving (since that will trace to the onmessage.)
		let err = new Error('PPSSPP returned an error');

		// Avoid confusion by resolving immediately for known no-response events.
		if (NoResponseEvents.includes(data.event)) {
			this.socket_.send(JSON.stringify(data));
			return Promise.resolve(null);
		}

		return new Promise((resolve, reject) => {
			const ticket = this.makeTicket_();

			this.pendingTickets_[ticket] = function (result) {
				if (result.event === 'error') {
					err.name = 'DebuggerError';
					err.message = result.message;
					err.originalMessage = result;
					reject(err);
				} else {
					resolve(result);
				}
			};

			this.socket_.send(JSON.stringify({ ...data, ticket }));
		});
	}

	setupSocket_() {
		this.socket_.onclose = () => {
			if (this.onClose) {
				this.onClose();
			}

			this.failAllPending_('PPSSPP disconnected');
		};

		this.socket_.onmessage = (e) => {
			try {
				const data = JSON.parse(e.data);

				if (data.event === 'error') {
					this.handleError_(data.message, data.level);
				}

				if ('ticket' in data) {
					this.handleTicket_(data.ticket, data);
				} else {
					this.handleMessage_(data);
				}
			} catch (err) {
				this.handleError_('Failed to parse message from PPSSPP: ' + err.message, ErrorLevels.ERROR);
			}
		};
	}

	tryNextEndpoint_(listing) {
		return new Promise((resolve, reject) => {
			if (!listing || listing.length === 0) {
				return reject(new Error('Couldn\'t connect automatically.  Is PPSSPP connected to the same network?'));
			}

			const endpoint = 'ws://' + listing[0].ip + ':' + listing[0].p + PPSSPP_DEFAULT_PATH;
			this.connect(endpoint).then(resolve, err => {
				if (listing.length > 1) {
					resolve(this.tryNextEndpoint_(listing.slice(1)));
				} else {
					reject(err);
				}
			});
		});
	}

	handleTicket_(ticket, data) {
		if (ticket in this.pendingTickets_) {
			const handler = this.pendingTickets_[data.ticket];
			delete this.pendingTickets_[data.ticket];

			handler(data);
		} else {
			this.handleError_('Received mismatched ticket: ' + JSON.stringify(data), ErrorLevels.ERROR);
		}
	}

	handleMessage_(data) {
		this.executeHandlers_('*', data);
		this.executeHandlers_(data.event, data);
	}

	executeHandlers_(name, data) {
		if (name in this.listeners_) {
			for (let handler of this.listeners_[name]) {
				handler(data);
			}
		}
	}

	handleError_(message, level) {
		if (this.onError) {
			this.onError(message, level);
		} else if (level === undefined || Number(level) === ErrorLevels.ERROR) {
			console.error(message);
		} else {
			console.log(message);
		}
	}

	makeTicket_() {
		let ticket = Math.random().toString(36).substr(2);
		if (ticket in this.pendingTickets_) {
			return this.makeTicket_();
		}
		return ticket;
	}

	failAllPending_(message) {
		const data = { event: 'error', message, level: ErrorLevels.ERROR };

		for (let ticket in this.pendingTickets_) {
			if (this.pendingTickets_.hasOwnProperty(ticket)) {
				this.pendingTickets_[ticket](data);
			}
		}
		this.pendingTickets_ = {};
	}

	onError: null;
	onClose: null;

	socket_ = null;
	pendingTickets_ = {};
	listeners_ = {};
};

export { ErrorLevels };
