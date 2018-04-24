import React, { Component } from 'react';
import Disasm from './CPU/Disasm';
import RegPanel from './CPU/RegPanel';
import listeners from '../utils/listeners.js';

class CPU extends Component {
	constructor(props) {
		super(props);

		this.state = {
			stepping: false,
			paused: true,
			pc: 0,
			lastTicks: 0,
			ticks: 0,
		};
	}

	render() {
		const pc = this.state.stepping || this.state.pc !== 0 ? this.state.pc : null;
		return (
			<div id="CPU">
				{/* TODO: Figure out styling.  Just placeholder. */}
				<div style={{ minHeight: '500px', display: 'flex' }}>
					<RegPanel {...this.props} stepping={this.state.stepping} />
					<div style={{ width: '100%', minWidth: '50%', height: '500px', overflowY: 'auto' }}>
						<Disasm {...this.props} pc={pc} />
					</div>
				</div>
				Paused: {this.state.paused ? 'y' : 'n'}, Stepping: {this.state.stepping ? 'y' : 'n'}
			</div>
		);
	}

	componentDidMount() {
		this.listeners_ = listeners.listen({
			'connection': () => this.onConnection(),
			'connection.change': () => this.onConnectionChange(),
			'cpu.stepping': (data) => this.onStepping(data),
			'cpu.resume': () => this.setState({ stepping: false }),
			'game.start': () => this.setState({ paused: false }),
			'game.quit': () => this.setState({ stepping: false, paused: true, pc: 0 }),
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
			const { stepping, paused, pc, ticks } = result;
			this.setState({ stepping, paused, pc, ticks, lastTicks: ticks });
		}, (err) => {
			this.setState({ stepping: false, paused: true });
		});
	}

	onStepping(data) {
		this.setState({
			stepping: true,
			pc: data.pc,
			lastTicks: this.state.ticks,
			ticks: data.ticks,
		});
	}
}

CPU.defaultProps = {
	ppsspp: null,
	log: null,
};

export default CPU;
