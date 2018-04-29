import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Disasm from './CPU/Disasm';
import DisasmButtons from './CPU/DisasmButtons';
import GotoBox from './CPU/GotoBox';
import RegPanel from './CPU/RegPanel';
import listeners from '../utils/listeners.js';
import './CPU.css';

class CPU extends Component {
	state = {
		stepping: false,
		paused: true,
		started: false,
		pc: 0,
		// Note: these are inclusive.
		selectionTop: null,
		selectionBottom: null,
		jumpMarker: null,
		lastTicks: 0,
		ticks: 0,
	};

	render() {
		const { stepping, started, selectionTop, selectionBottom, jumpMarker, pc } = this.state;
		const disasmProps = { stepping, started, selectionTop, selectionBottom, jumpMarker, pc };

		return (
			<div id="CPU">
				<div className="CPU__pane">
					<GotoBox ppsspp={this.props.ppsspp} started={this.state.started} gotoDisasm={this.gotoDisasm} />
					<RegPanel {...this.props} stepping={this.state.stepping} gotoDisasm={this.gotoDisasm} />
				</div>
				<div className="Disasm__container">
					<DisasmButtons ppsspp={this.props.ppsspp} />
					<Disasm {...this.props} {...disasmProps} updateSelection={this.updateSelection} />
				</div>
			</div>
		);
	}

	componentDidMount() {
		this.listeners_ = listeners.listen({
			'connection': () => this.onConnection(),
			'connection.change': () => this.onConnectionChange(),
			'cpu.stepping': (data) => this.onStepping(data),
			'cpu.resume': () => this.setState({ stepping: false }),
			'game.start': () => this.setState({ started: true, paused: false }),
			'game.quit': () => this.setState({ started: false, stepping: false, paused: true, pc: 0 }),
			'game.pause': () => this.setState({ paused: true }),
			'game.resume': () => this.setState({ paused: false }),
			'cpu.setReg': (result) => {
				if (result.category === 0 && result.register === 32) {
					this.setState({ pc: result.uintValue });
				}
			},
		});
	}

	componentWillUnmount() {
		listeners.forget(this.listeners_);
	}

	onConnectionChange() {
		// On any reconnect, assume paused until proven otherwise.
		this.setState({ started: false, stepping: false, paused: true });
	}

	onConnection() {
		// Update the status of this connection immediately too.
		this.props.ppsspp.send({ event: 'cpu.status' }).then((result) => {
			const { stepping, paused, pc, ticks } = result;
			const started = pc !== 0 || stepping;
			this.setState({ started, stepping, paused, pc, ticks, lastTicks: ticks });
		}, (err) => {
			this.setState({ stepping: false, paused: true });
		});
	}

	onStepping(data) {
		this.setState({
			stepping: true,
			pc: data.pc,
			selectionTop: data.pc,
			selectionBottom: data.pc,
			lastTicks: this.state.ticks,
			ticks: data.ticks,
		});
	}

	updateSelection = (data) => {
		this.setState(data)
	}

	gotoDisasm = (pc) => {
		this.setState({
			selectionTop: pc,
			selectionBottom: pc,
			// It just matters that this is a new object.
			jumpMarker: {},
		});
	}
}

CPU.propTypes = {
	ppsspp: PropTypes.object.isRequired,
	log: PropTypes.func.isRequired,
};

export default CPU;
