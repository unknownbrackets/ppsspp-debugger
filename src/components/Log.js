import React, { Component } from 'react';
import LogItem from './LogItem';
import './Log.css';

const MAX_LINES = 5000;

class Log extends Component {
	constructor(props) {
		super(props);

		this.state = {
			id: 0,
			items: [],
			listener: null,
		};
	}

	render() {
		return (
			<div id="Log">
				{this.state.items.map(this.renderItem.bind(this))}
			</div>
		);
	}

	renderItem(item) {
		const isLatestItem = item.id === this.state.id;
		return <LogItem key={item.id} isLatestItem={isLatestItem} item={item} />;
	}

	registerListener() {
		this.props.ppsspp.onError = (message, level) => {
			const newItem = { message: message + '\n', level };
			this.addLogItem(newItem);
		};

		return this.props.ppsspp.listen('log', (data) => {
			const newItem = { ...data };
			this.addLogItem(newItem);
		});
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

	checkConnected() {
		if (this.props.ppsspp !== null && this.state.listener === null) {
			const listener = this.registerListener();
			this.setState({ listener });
		}
		if (this.props.ppsspp === null && this.state.listener !== null) {
			this.state.listener.remove();
			this.setState({ listener: null });
		}
	}

	componentDidMount() {
		this.checkConnected();
	}

	componentDidUpdate(prevProps, prevState) {
		this.checkConnected();
	}

	componentWillUnmount() {
		if (this.state.listener) {
			this.state.listener.remove();
		}
	}
}

Log.defaultProps = {
	ppsspp: null,
};

export default Log;
