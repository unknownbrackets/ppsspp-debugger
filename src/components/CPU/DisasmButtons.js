import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import BreakpointModal from './BreakpointModal';
import listeners from '../../utils/listeners.js';
import './DisasmButtons.css';

class DisasmButtons extends PureComponent {
	state = {
		breakpointModalOpen: false,
		connected: false,
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
				<button type="button" disabled={disabled}>Step Into</button>
				<button type="button" disabled={disabled}>Step Over</button>
				<button type="button" disabled={disabled}>Step Out</button>
				<span className="DisasmButtons__spacer"></span>
				<button type="button" disabled={disabled}>Next HLE</button>
				<span className="DisasmButtons__spacer"></span>
				<button type="button" onClick={this.handleBreakpointOpen} disabled={!this.state.connected}>Breakpoint</button>
				<span className="DisasmButtons__spacer"></span>
				<span className="DisasmButtons__thread">
					Thread: TODO
				</span>

				<BreakpointModal isOpen={this.state.breakpointModalOpen} onClose={this.handleBreakpointClose} />
			</div>
		);
	}

	componentDidMount() {
		this.listeners_ = listeners.listen({
			'connection.change': (connected) => this.setState({ connected }),
		});
	}

	componentWillUnmount() {
		listeners.forget(this.listeners_);
	}

	handleGoStop = () => {
		this.props.ppsspp.send({
			event: this.props.stepping ? 'cpu.resume' : 'cpu.stepping',
		}).catch(() => {
			// Already logged, let's assume the parent will have marked it disconnected/not started by now.
		});
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
};

export default DisasmButtons;
