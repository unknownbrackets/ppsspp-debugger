import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-modal';
import './DisasmButtons.css';
import '../ext/react-modal.css';

class DisasmButtons extends PureComponent {
	state = {
		breakpointModalOpen: false,
	};

	render() {
		const disabled = !this.props.started || !this.props.stepping;

		return (
			<div className="DisasmButtons">
				<button type="button" disabled={!this.props.started}>
					{this.props.stepping || !this.props.started ? 'Go' : 'Stop'}
				</button>
				<span className="DisasmButtons__spacer"></span>
				<button type="button" disabled={disabled}>Step Into</button>
				<button type="button" disabled={disabled}>Step Over</button>
				<button type="button" disabled={disabled}>Step Out</button>
				<span className="DisasmButtons__spacer"></span>
				<button type="button" disabled={disabled}>Next HLE</button>
				<span className="DisasmButtons__spacer"></span>
				<button type="button" onClick={this.handleBreakpointOpen}>Breakpoint</button>
				<span className="DisasmButtons__spacer"></span>
				<span className="DisasmButtons__thread">
					Thread: TODO
				</span>

				{/* TODO: Separate component. */}
				<Modal
					isOpen={this.state.breakpointModalOpen}
					onRequestClose={this.handleBreakpointClose}
					contentLabel="Breakpoint settings"
					className="ReactModal__FitContent" overlayClassName="ReactModal__FitOverlay"
					closeTimeoutMS={150}
				>
					Fit to content
				</Modal>
			</div>
		);
	}

	handleBreakpointOpen = () => {
		this.setState({ breakpointModalOpen: true });
	}

	handleBreakpointClose = () => {
		this.setState({ breakpointModalOpen: false });
	}
}

DisasmButtons.propTypes = {
	ppsspp: PropTypes.object.isRequired,
	started: PropTypes.bool.isRequired,
	stepping: PropTypes.bool.isRequired,
};

export default DisasmButtons;
