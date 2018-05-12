import React, { PureComponent } from 'react';
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
	listeners_;

	render() {
		const disabled = !this.props.started || !this.props.stepping;

		return (
			<div className="DisasmButtons">
				<button type="button" disabled={!this.props.started || this.props.paused} onClick={this.handleGoStop}>
					{this.props.stepping || !this.props.started ? 'Go' : 'Stop'}
				</button>
				<span className="DisasmButtons__spacer"></span>
				<button type="button" disabled={disabled} onClick={this.handleStepInto}>Step Into</button>
				<button type="button" disabled={disabled} onClick={this.handleStepOver}>Step Over</button>
				<button type="button" disabled={disabled} onClick={this.handleStepOut}>Step Out</button>
				<span className="DisasmButtons__spacer"></span>
				<button type="button" disabled={disabled} onClick={this.handleNextHLE}>Next HLE</button>
				<span className="DisasmButtons__spacer"></span>
				<button type="button" onClick={this.handleBreakpointOpen} disabled={!this.props.started}>Breakpoint</button>
				<span className="DisasmButtons__spacer"></span>
				<span className="DisasmButtons__thread-list">
					Thread: {this.renderThreadList()}
				</span>

				<BreakpointModal
					ppsspp={this.props.ppsspp}
					currentThread={this.props.currentThread}
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
			<select onChange={this.handleThreadSelect} value={this.props.currentThread || this.state.lastThread}>
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
			this.updateThreadList(false);
		}
	}

	updateThreadList(resetCurrentThread) {
		this.props.ppsspp.send({
			event: 'hle.thread.list',
		}).then(({ threads }) => {
			this.setState({ threads });
			if (resetCurrentThread) {
				const currentThread = threads.find(th => th.isCurrent);
				if (currentThread && currentThread.id !== this.props.currentThread) {
					this.props.updateCurrentThread(currentThread.id);
				}
			}
		}, () => {
			this.setState({ threads: [] });
		});
	}

	handleGoStop = () => {
		if (this.props.stepping) {
			this.props.updateCurrentThread(undefined);
		}
		this.props.ppsspp.send({
			event: this.props.stepping ? 'cpu.resume' : 'cpu.stepping',
		}).catch(() => {
			// Already logged, let's assume the parent will have marked it disconnected/not started by now.
		});
	}

	handleStepInto = () => {
		this.props.updateCurrentThread(undefined);
		this.props.ppsspp.send({
			event: 'cpu.stepInto',
			thread: this.props.currentThread,
		}).catch(() => {
			// Already logged, let's assume the parent will have marked it disconnected/not started by now.
		});
	}

	handleStepOver = () => {
		this.props.updateCurrentThread(undefined);
		this.props.ppsspp.send({
			event: 'cpu.stepOver',
			thread: this.props.currentThread,
		}).catch(() => {
			// Already logged, let's assume the parent will have marked it disconnected/not started by now.
		});
	}

	handleStepOut = () => {
		const threadID = this.props.currentThread;
		this.props.updateCurrentThread(undefined);
		this.props.ppsspp.send({
			event: 'cpu.stepOut',
			thread: this.props.currentThread,
		}).catch(() => {
			// This might fail if they aren't inside a function call on this thread, so restore the thread.
			this.props.updateCurrentThread(threadID);
		});
	}

	handleNextHLE = () => {
		this.props.updateCurrentThread(undefined);
		this.props.ppsspp.send({
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
	ppsspp: PropTypes.object.isRequired,
	started: PropTypes.bool.isRequired,
	paused: PropTypes.bool.isRequired,
	stepping: PropTypes.bool.isRequired,
	currentThread: PropTypes.number,

	updateCurrentThread: PropTypes.func.isRequired,
};

export default DisasmButtons;
