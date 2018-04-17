import React, { Component } from 'react';

class LogItem extends Component {
	constructor(props) {
		super(props);

		this.spanRef = React.createRef();
	}

	render() {
		if (this.props.item.event === 'log') {
			return this.formatLogEvent();
		}

		return this.renderInternal();
	}

	renderInternal() {
		return (
			<span className={this.makeClassName()} ref={this.spanRef}>
				{this.props.item.message}
			</span>
		);
	}

	formatLogEvent() {
		const { item } = this.props;
		// TODO: Move timestamp separation to API?
		const timestamp = item.header.substr(0, 10);
		const header = item.header.substr(10) + ' ';
		return (
			<span className={this.makeClassName()} ref={this.spanRef}>
				<span className="Log__message__header">
					<span className="Log__message__timestamp">{timestamp}</span>
					{header}
				</span>
				{item.message}
			</span>
		);
	}

	componentDidMount() {
		if (this.props.isLatestItem)
			this.spanRef.current.scrollIntoView();
	}

	makeClassName() {
		const { item } = this.props;
		let itemClass = 'Log__message';

		if (item.event === 'log') {
			itemClass += ' Log__message--channel-' + item.channel;
		} else {
			itemClass += ' Log__message--internal';
		}

		if (item.level !== undefined)
			itemClass += ' Log__message--level-' + item.level;

		return itemClass;
	}
}

export default LogItem;
