import React, { Component } from 'react';

class CPU extends Component {
	constructor(props) {
		super(props);

		this.state = {
			stepping: false,
			paused: true,
			listeners: null,
		};
	}

	render() {
		return (
			<div id="CPU">
				Paused: {this.state.paused ? 'y' : 'n'}, Stepping: {this.state.stepping ? 'y' : 'n'}
			</div>
		);
	}

	registerListeners() {
		let listeners = [];
		const listen = (name, handler) => {
			listeners.push(this.props.ppsspp.listen(name, handler));
		};
		listen('cpu.stepping', (data) => {
			this.setState({ stepping: true });
		});
		listen('cpu.resume', (data) => {
			this.setState({ stepping: false });
		});
		listen('game.start', (data) => {
			this.setState({ paused: false });
		});
		listen('game.quit', (data) => {
			this.setState({ stepping: false, paused: true });
		});
		listen('game.pause', (data) => {
			this.setState({ paused: true });
		});
		listen('game.resume', (data) => {
			this.setState({ paused: false });
		});
		return listeners;
	}

	connectionChanged() {
		let listeners = null;
		if (this.state.listeners !== null) {
			// Remove the old listeners, even if we have a new connection.
			this.state.listeners.map(l => l.remove());
		}
		if (this.props.ppsspp !== null) {
			// Update the status of this connection immediately too.
			this.props.ppsspp.send({ event: 'cpu.status' }).then((result) => {
				const { stepping, paused } = result;
				this.setState({ stepping, paused });
			});
			listeners = this.registerListeners();
		}

		// On any reconnect, assume paused until proven otherwise.
		this.setState({ stepping: false, paused: true, listeners });
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
		if (this.state.listeners !== null) {
			this.state.listeners.map(l => l.remove());
		}
	}
}

CPU.defaultProps = {
	ppsspp: null,
	log: null,
};

export default CPU;
