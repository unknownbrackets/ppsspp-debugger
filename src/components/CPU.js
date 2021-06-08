import { PureComponent } from 'react';
import DebuggerContext, { DebuggerContextValues } from './DebuggerContext';
import Disasm from './CPU/Disasm';
import DisasmButtons from './CPU/DisasmButtons';
import GotoBox from './common/GotoBox';
import LeftPanel from './CPU/LeftPanel';
import listeners from '../utils/listeners.js';
import './CPU.css';

class CPU extends PureComponent {
	state = {
		setInitialPC: false,
		// Note: these are inclusive.
		selectionTop: null,
		selectionBottom: null,
		jumpMarker: null,
		promptGotoMarker: null,
		lastTicks: 0,
		ticks: 0,
		navTray: false,
	};
	/**
	 * @type {DebuggerContextValues}
	 */
	context;
	listeners_;

	render() {
		const { stepping, paused, started, pc, currentThread } = this.context.gameStatus;
		const commonProps = { stepping: stepping && !paused, paused, started, currentThread };
		const { selectionTop, selectionBottom, jumpMarker, setInitialPC, navTray } = this.state;
		const disasmProps = { ...commonProps, selectionTop, selectionBottom, jumpMarker, pc, setInitialPC };

		return (
			<div id="CPU">
				<div className={navTray ? 'CPU__pane CPU__pane--open' : 'CPU__pane'}>
					<button type="button" onClick={this.hideNavTray} className="CPU__paneClose">Close</button>
					<GotoBox ppsspp={this.context.ppsspp} {...commonProps} gotoAddress={this.gotoDisasm} includePC={true} promptGotoMarker={this.state.promptGotoMarker} />
					<LeftPanel {...this.props} {...this.context} {...commonProps} gotoDisasm={this.gotoDisasm} />
				</div>
				<div className="Disasm__container">
					<DisasmButtons {...this.props} {...this.context} {...commonProps} updateCurrentThread={this.updateCurrentThread} showNavTray={this.showNavTray} />
					<Disasm {...this.props} {...this.context} {...disasmProps} updateSelection={this.updateSelection} promptGoto={this.promptGoto} />
				</div>
			</div>
		);
	}

	componentDidMount() {
		this.listeners_ = listeners.listen({
			'connection': () => this.onConnection(),
			'cpu.stepping': (data) => this.onStepping(data),
			'game.start': () => {
				// This may often not happen if the register list is visible.
				if (!this.state.setInitialPC) {
					this.updateInitialPC();
				}
			},
			'game.quit': () => {
				this.setState({
					setInitialPC: false,
				});
			},
			'cpu.setReg': (result) => {
				if (result.category === 0 && result.register === 32) {
					const pc = result.uintValue;
					if (!this.state.setInitialPC) {
						this.gotoDisasm(pc);
					}
					this.setState({ setInitialPC: pc !== 0 });
				}
			},
			'cpu.getAllRegs': (result) => {
				const pc = result.categories[0].uintValues[32];
				if (!this.state.setInitialPC) {
					this.gotoDisasm(pc);
				}
				this.setState({ setInitialPC: pc !== 0 });
			},
		});
	}

	componentWillUnmount() {
		listeners.forget(this.listeners_);
	}

	onConnection() {
		// Update the status of this connection immediately too.
		this.context.ppsspp.send({ event: 'cpu.status' }).then((result) => {
			const { pc, ticks } = result;

			if (!this.state.setInitialPC) {
				this.gotoDisasm(pc);
			}
			this.setState({ setInitialPC: pc !== 0, ticks, lastTicks: ticks });
		});
	}

	onStepping(data) {
		this.setState({
			selectionTop: data.pc,
			selectionBottom: data.pc,
			lastTicks: this.state.ticks,
			ticks: data.ticks,
		});
	}

	updateSelection = (data) => {
		this.setState(data);
	}

	gotoDisasm = (pc) => {
		this.setState({
			selectionTop: pc,
			selectionBottom: pc,
			// It just matters that this is a new object.
			jumpMarker: {},
		});
	}

	promptGoto = () => {
		this.setState({
			promptGotoMarker: {},
		});
	}

	updateCurrentThread = (currentThread, pc) => {
		this.setState({ setInitialPC: pc !== 0 && pc !== undefined });
		this.context.gameStatus.setState({ currentThread });
		if (pc !== 0 && pc !== undefined) {
			this.context.gameStatus.setState({ pc });
			this.gotoDisasm(pc);
		}
	}

	showNavTray = () => {
		this.setState({ navTray: true });
	}

	hideNavTray = () => {
		this.setState({ navTray: false });
	}

	updateInitialPC = () => {
		this.context.ppsspp.send({ event: 'cpu.getReg', name: 'pc' }).then(result => {
			const pc = result.uintValue;
			if (!this.state.setInitialPC) {
				this.gotoDisasm(pc);
			}
			this.setState({ setInitialPC: pc !== 0 });
			this.context.gameStatus.setState({ pc });
		});
	}
}

CPU.contextType = DebuggerContext;

export default CPU;
