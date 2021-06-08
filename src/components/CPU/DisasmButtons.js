import { PureComponent } from 'react';
import DebuggerContext, { DebuggerContextValues } from '../DebuggerContext';
import PropTypes from 'prop-types';
import BreakpointModal from './BreakpointModal';
import listeners from '../../utils/listeners.js';
import './DisasmButtons.css';

class DisasmButtons extends PureComponent {
	state = {
		breakpointModalOpen: false,
		connected: false,
		lastThread: '',
		threads: [],
	};
	/**
	 * @type {DebuggerContextValues}
	 */
	context;
	listeners_;

	render() {
		const { started, paused, stepping } = this.context.gameStatus;
		const disabled = !started || !stepping || paused;

		return (
			<div className="DisasmButtons">
				<div className="DisasmButtons__group DisasmButtons__nav">
					<button type="button" onClick={this.props.showNavTray}>Nav</button>
					<span className="DisasmButtons__spacer"></span>
				</div>
				<div className="DisasmButtons__group">
					<button type="button" disabled={!started || paused} onClick={this.handleGoBreak}>
						{stepping || !started ? 'Go' : 'Break'}
					</button>
					<span className="DisasmButtons__spacer"></span>
				</div>
				<div className="DisasmButtons__group">
					<button type="button" disabled={disabled} onClick={this.handleStepInto}>Step Into</button>
					<button type="button" disabled={disabled} onClick={this.handleStepOver}>Step Over</button>
					<button type="button" disabled={disabled} onClick={this.handleStepOut}>Step Out</button>
					<span className="DisasmButtons__spacer"></span>
				</div>
				<div className="DisasmButtons__group">
					<button type="button" disabled={disabled} onClick={this.handleNextHLE}>Next HLE</button>
					<span className="DisasmButtons__spacer"></span>
				</div>
				<div className="DisasmButtons__group">
					<button type="button" onClick={this.handleBreakpointOpen} disabled={!started}>Breakpoint</button>
					<span className="DisasmButtons__spacer"></span>
				</div>
				<div className="DisasmButtons__group">
					<span className="DisasmButtons__thread-list">
						Thread: {this.renderThreadList()}
					</span>
				</div>

				<BreakpointModal
					isOpen={this.state.breakpointModalOpen}
					onClose={this.handleBreakpointClose}
				/>
			</div>
		);
	}

	renderThreadList() {
		if (this.state.threads.length === 0) {
			return '(none)';
		}
		return (
			<select onChange={this.handleThreadSelect} value={this.context.gameStatus.currentThread || this.state.lastThread}>
				{this.state.threads.map(thread => this.renderThread(thread))}
			</select>
		);
	}

	renderThread(thread) {
		const classes = 'DisasmButtons__thread' + (thread.isCurrent ? ' DisasmButtons__thread--current' : '');
		return (
			<option key={thread.id} value={thread.id} className={classes}>
				{thread.name}{thread.isCurrent ? ' (current)' : ''}
			</option>
		);
	}

	componentDidMount() {
		this.listeners_ = listeners.listen({
			'connection.change': (connected) => this.setState({ connected }),
			'cpu.stepping': () => this.updateThreadList(true),
		});
	}

	componentWillUnmount() {
		listeners.forget(this.listeners_);
	}

	componentDidUpdate(prevProps, prevState) {
		if (!prevState.connected && this.state.connected) {
			this.updateThreadList(this.context.gameStatus.currentThread === undefined);
		}
	}

	updateThreadList(resetCurrentThread) {
		if (!this.state.connected) {
			// This avoids a duplicate update during initial connect.
			return;
		}

		this.context.ppsspp.send({
			event: 'hle.thread.list',
		}).then(({ threads }) => {
			this.setState({ threads });
			if (resetCurrentThread) {
				const currentThread = threads.find(th => th.isCurrent);
				if (currentThread && currentThread.id !== this.context.gameStatus.currentThread) {
					this.props.updateCurrentThread(currentThread.id);
				}
			}
		}, () => {
			this.setState({ threads: [] });
		});
	}

	handleGoBreak = () => {
		if (this.context.gameStatus.stepping) {
			this.props.updateCurrentThread(undefined);
		}
		this.context.ppsspp.send({
			event: this.context.gameStatus.stepping ? 'cpu.resume' : 'cpu.stepping',
		}).catch(() => {
			// Already logged, let's assume the parent will have marked it disconnected/not started by now.
		});
	}

	handleStepInto = () => {
		this.props.updateCurrentThread(undefined);
		this.context.ppsspp.send({
			event: 'cpu.stepInto',
			thread: this.context.gameStatus.currentThread,
		}).catch(() => {
			// Already logged, let's assume the parent will have marked it disconnected/not started by now.
		});
	}

	handleStepOver = () => {
		this.props.updateCurrentThread(undefined);
		this.context.ppsspp.send({
			event: 'cpu.stepOver',
			thread: this.context.gameStatus.currentThread,
		}).catch(() => {
			// Already logged, let's assume the parent will have marked it disconnected/not started by now.
		});
	}

	handleStepOut = () => {
		const threadID = this.context.gameStatus.currentThread;
		this.props.updateCurrentThread(undefined);
		this.context.ppsspp.send({
			event: 'cpu.stepOut',
			thread: this.context.gameStatus.currentThread,
		}).catch(() => {
			// This might fail if they aren't inside a function call on this thread, so restore the thread.
			this.props.updateCurrentThread(threadID);
		});
	}

	handleNextHLE = () => {
		this.props.updateCurrentThread(undefined);
		this.context.ppsspp.send({
			event: 'cpu.nextHLE',
		}).catch(() => {
			// Already logged, let's assume the parent will have marked it disconnected/not started by now.
		});
	}

	handleThreadSelect = (ev) => {
		const currentThread = this.state.threads.find(th => th.id === Number(ev.target.value));
		if (currentThread) {
			this.props.updateCurrentThread(currentThread.id, currentThread.pc);
		}
	}

	handleBreakpointOpen = () => {
		this.setState({ breakpointModalOpen: true });
	}

	handleBreakpointClose = () => {
		this.setState({ breakpointModalOpen: false });
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		let update = null;
		if (nextProps.currentThread && nextProps.currentThread !== prevState.lastThread) {
			update = { ...update, lastThread: nextProps.currentThread || '' };
		}
		if (nextProps.stepping || nextProps.started) {
			update = { ...update, connected: true };
		}
		if (!nextProps.started && prevState.threads.length) {
			update = { ...update, threads: [] };
		}
		return update;
	}
}

DisasmButtons.propTypes = {
	started: PropTypes.bool.isRequired,
	stepping: PropTypes.bool.isRequired,
	currentThread: PropTypes.number,
	showNavTray: PropTypes.func.isRequired,

	updateCurrentThread: PropTypes.func.isRequired,
};

DisasmButtons.contextType = DebuggerContext;

export default DisasmButtons;
