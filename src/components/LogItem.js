import { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classNames from 'clsx';

class LogItem extends PureComponent {
	render() {
		if (this.props.item.event === 'log') {
			return this.formatLogEvent();
		}

		return this.renderInternal();
	}

	renderInternal() {
		return (
			<span className={this.makeClassName()}>
				{this.props.item.message}
			</span>
		);
	}

	formatLogEvent() {
		const { item } = this.props;
		return (
			<span className={this.makeClassName()}>
				<span className="Log__message__header">
					<span className="Log__message__timestamp">{item.timestamp}</span>
					{' ' + item.header + ' '}
				</span>
				{item.message}
			</span>
		);
	}

	makeClassName() {
		const { item } = this.props;

		return classNames('Log__message', {
			'Log__message--internal': item.event !== 'log',
			['Log__message--channel-' + item.channel]: item.event === 'log',
			['Log__message--level-' + item.level]: true,
		});
	}
}

LogItem.propTypes = {
	item: PropTypes.shape({
		event: PropTypes.string,
		channel: PropTypes.string,
		level: PropTypes.number,
		timestamp: PropTypes.string,
		header: PropTypes.string,
		message: PropTypes.string.isRequired,
	}).isRequired,
};

export default LogItem;
