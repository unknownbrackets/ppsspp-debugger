import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import './DisasmButtons.css';

class DisasmButtons extends PureComponent {
	render() {
		return (
			<div className="DisasmButtons">
				<button type="button">Go</button>
				<span className="DisasmButtons__spacer"></span>
				<button type="button">Step Into</button>
				<button type="button">Step Over</button>
				<button type="button">Step Out</button>
				<span className="DisasmButtons__spacer"></span>
				<button type="button">Next HLE</button>
				<span className="DisasmButtons__spacer"></span>
				<button type="button">Breakpoint</button>
				<span className="DisasmButtons__spacer"></span>
				<span className="DisasmButtons__thread">
					Thread: TODO
				</span>
			</div>
		);
	}
}

DisasmButtons.propTypes = {
	ppsspp: PropTypes.object.isRequired,
};

export default DisasmButtons;
