import { PureComponent } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import BreakpointPanel from './CPU/BreakpointPanel';
import DebuggerContext, { DebuggerContextValues } from './DebuggerContext';
import Disasm from './CPU/Disasm';
import DisasmButtons from './CPU/DisasmButtons';
import GotoBox from './common/GotoBox';
import LeftPanel from './CPU/LeftPanel';
import listeners from '../utils/listeners.js';
import Log from './Log';
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
		const { pc, currentThread } = this.context.gameStatus;
		const { selectionTop, selectionBottom, jumpMarker, setInitialPC, navTray } = this.state;
		const disasmProps = { currentThread, selectionTop, selectionBottom, jumpMarker, pc, setInitialPC };

		return (
			<div id="CPU">
				{this.renderMain(navTray, disasmProps)}
				{this.renderUtilityPanel()}
			</div>
		);
	}

	renderMain(navTray, disasmProps) {
		const { stepping, paused, started, currentThread } = this.context.gameStatus;

		return (
			<div className="CPU__main">
				<div className={navTray ? 'CPU__pane CPU__pane--open' : 'CPU__pane'}>
					<button type="button" onClick={this.hideNavTray} className="CPU__paneClose">Close</button>
					<GotoBox gotoAddress={this.gotoDisasm} includePC={true} promptGotoMarker={this.state.promptGotoMarker} />
					<LeftPanel gotoDisasm={this.gotoDisasm} />
				</div>
				<div className="Disasm__container">
					<DisasmButtons stepping={stepping && !paused} started={started} currentThread={currentThread} updateCurrentThread={this.updateCurrentThread} showNavTray={this.showNavTray} />
					<Disasm {...disasmProps} updateSelection={this.updateSelection} promptGoto={this.promptGoto} />
				</div>
			</div>
		);
	}

	renderUtilityPanel() {
		return (
			<div className="CPU__utilityPanel App-utilityPanel">
				<Tabs onSelect={this.handleSelect}>
					<TabList>
						<Tab>Log</Tab>
						<Tab>Breakpoints</Tab>
					</TabList>
					<TabPanel forceRender={true}>
						<Log />
					</TabPanel>
					<TabPanel>
						<BreakpointPanel gotoDisasm={this.gotoDisasm} />
					</TabPanel>
				</Tabs>
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
		this.setState(prevState => ({
			selectionTop: data.pc,
			selectionBottom: data.pc,
			lastTicks: prevState.ticks,
			ticks: data.ticks,
		}));
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
