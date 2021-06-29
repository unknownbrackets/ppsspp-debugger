import listeners from './listeners';
import { useEffect, useState } from 'react';

const MAX_LINES = 5000;

class Logger {
	constructor() {
		this.id_ = 0;
		this.items_ = [];
		this.changeListeners_ = [];
	}

	init(ppsspp) {
		ppsspp.onError = (message, level) => {
			const newItem = { message: message + '\n', level };
			this.addLogItem(newItem);
		};

		listeners.listen({
			'log': this.onLogEvent.bind(this),
		});
	}

	onLogEvent(data) {
		const newItem = { ...data };
		this.addLogItem(newItem);
	}

	addLogItem(newItem) {
		const id = this.id_ + 1;
		const itemWithId = { id, ...newItem };
		this.items_ = this.items_.concat([itemWithId ]).slice(-MAX_LINES);
		for (let listener of this.changeListeners_) {
			listener(this.items_);
		}
	}

	listen(listener) {
		if(!this.changeListeners_.includes(listener)) {
			this.changeListeners_.push(listener);
			listener(this.items_); // Make sure listener receives initial state
		}
	}

	forget(listener) {
		this.changeListeners_ = this.changeListeners_.filter(e => e !== listener);
	}
}

const logger = new Logger();
export default logger;

export function useLogItems() {
	const [logItems, setLogItems] = useState([]);

	useEffect(() => {
		function changeListener(items) {
			setLogItems(items);
		}

		logger.listen(changeListener);
		return () => logger.forget(changeListener);
	}, []);

	return logItems;
}
