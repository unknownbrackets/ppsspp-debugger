import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import BreakpointModal from './BreakpointModal';
import listeners from '../../utils/listeners.js';
import './DisasmButtons.css';

class DisasmButtons extends PureComponent {
	state = {
		breakpointModalOpen: false,
		connected: false,
		threads: [],
	};
	listeners_;

	render() {
		const disabled = !this.props.started || !this.props.stepping;

		return (
			<div className="DisasmButtons">
				<button type="button" disabled={!this.props.started} onClick={this.handleGoStop}>
					{this.props.stepping || !this.props.started ? 'Go' : 'Stop'}
				</button>
				<span className="DisasmButtons__spacer"></span>
				<button type="button" disabled={disabled} onClick={this.handleStepInto}>Step Into</button>
				<button type="button" disabled={disabled} onClick={this.handleStepOver}>Step Over</button>
				<button type="button" disabled={disabled} onClick={this.handleStepOut}>Step Out</button>
				<span className="DisasmButtons__spacer"></span>
				<button type="button" disabled={disabled} onClick={this.handleNextHLE}>Next HLE</button>
				<span className="DisasmButtons__spacer"></span>
				<button type="button" onClick={this.handleBreakpointOpen} disabled={!this.state.connected}>Breakpoint</button>
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
		return (
			<select onChange={this.handleThreadSelect} value={this.props.currentThread || ''}>
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
		this.props.ppsspp.send({
			event: this.props.stepping ? 'cpu.resume' : 'cpu.stepping',
		}).catch(() => {
			// Already logged, let's assume the parent will have marked it disconnected/not started by now.
		});
	}

	handleStepInto = () => {
		this.props.ppsspp.send({
			event: 'cpu.stepInto',
			thread: this.props.currentThread,
		}).catch(() => {
			// Already logged, let's assume the parent will have marked it disconnected/not started by now.
		});
	}

	handleStepOver = () => {
		this.props.ppsspp.send({
			event: 'cpu.stepOver',
			thread: this.props.currentThread,
		}).catch(() => {
			// Already logged, let's assume the parent will have marked it disconnected/not started by now.
		});
	}

	handleStepOut = () => {
		this.props.ppsspp.send({
			event: 'cpu.stepOut',
			thread: this.props.currentThread,
		}).catch(() => {
			// Already logged, let's assume the parent will have marked it disconnected/not started by now.
		});
	}

	handleNextHLE = () => {
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
		if (nextProps.stepping || nextProps.started) {
			return { connected: true };
		}
		return null;
	}
}

DisasmButtons.propTypes = {
	ppsspp: PropTypes.object.isRequired,
	started: PropTypes.bool.isRequired,
	stepping: PropTypes.bool.isRequired,
	currentThread: PropTypes.number,

	updateCurrentThread: PropTypes.func.isRequired,
};

export default DisasmButtons;
