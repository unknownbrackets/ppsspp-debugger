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

	connectionChanged() {
		let listener = null;
		if (this.state.listener !== null) {
			// Remove the old listener, even if we have a new connection.
			this.state.listener.remove();
		}
		if (this.props.ppsspp !== null) {
			listener = this.registerListener();
		}
		this.setState({ listener });
	}

	componentDidMount() {
		if (this.props.ppsspp !== null) {
			this.connectionChanged();
		}
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevProps.ppsspp !== this.props.ppsspp) {
			this.connectionChanged();
		}
	}

	componentWillUnmount() {
		if (this.state.listener !== null) {
			this.state.listener.remove();
		}
	}
}

Log.defaultProps = {
	ppsspp: null,
};

export default Log;
