import { createRef, PureComponent } from 'react';
import DebuggerContext, { DebuggerContextValues } from './DebuggerContext';
import listeners from '../utils/listeners.js';
import './Log.css';

const MAX_LINES = 5000;

class Log extends PureComponent {
	state = {
		id: 0,
		items: [],
	};
	/**
	 * @type {DebuggerContextValues}
	 */
	context;
	divRef;

	constructor(props) {
		super(props);

		this.divRef = createRef();
	}

	render() {
		return null;
	}

	addLogItem(newItem) {
		const id = this.state.id + 1;
		const itemWithId = { id, ...newItem };
		const items = this.state.items.concat([itemWithId ]).slice(-MAX_LINES);
		this.setState({
			id,
			items,
		});
	}

	componentDidMount() {
		this.context.ppsspp.onError = (message, level) => {
			const newItem = { message: message + '\n', level };
			this.addLogItem(newItem);
		};

		this.listeners_ = listeners.listen({
			'log': this.onLogEvent.bind(this),
		});
	}

	componentWillUnmount() {
		listeners.forget(this.listeners_);
	}

	onLogEvent(data) {
		const newItem = { ...data };
		this.addLogItem(newItem);
	}
}

Log.contextType = DebuggerContext;

export default Log;
