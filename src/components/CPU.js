import React, { Component } from 'react';
import listeners from '../utils/listeners.js';

class CPU extends Component {
	constructor(props) {
		super(props);

		this.state = {
			stepping: false,
			paused: true,
		};
	}

	render() {
		return (
			<div id="CPU">
				Paused: {this.state.paused ? 'y' : 'n'}, Stepping: {this.state.stepping ? 'y' : 'n'}
			</div>
		);
	}

	componentDidMount() {
		this.listeners_ = listeners.listen({
			'connection': () => this.onConnection(),
			'connection.change': () => this.onConnectionChange(),
			'cpu.stepping': () => this.setState({ stepping: true }),
			'cpu.resume': () => this.setState({ stepping: false }),
			'game.start': () => this.setState({ paused: false }),
			'game.quit': () => this.setState({ stepping: false, paused: true }),
			'game.pause': () => this.setState({ paused: true }),
			'game.resume': () => this.setState({ paused: false }),
		});
	}

	componentWillUnmount() {
		listeners.forget(this.listeners_);
	}

	onConnectionChange() {
		// On any reconnect, assume paused until proven otherwise.
		this.setState({ stepping: false, paused: true });
	}

	onConnection() {
		// Update the status of this connection immediately too.
		this.props.ppsspp.send({ event: 'cpu.status' }).then((result) => {
			const { stepping, paused } = result;
			this.setState({ stepping, paused });
		});
	}
}

CPU.defaultProps = {
	ppsspp: null,
	log: null,
};

export default CPU;
