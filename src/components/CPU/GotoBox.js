import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import './GotoBox.css';

class GotoBox extends PureComponent {
	render() {
		/* eslint no-script-url: "off" */
		return (
			<form action="javascript://" className="GotoBox">
				<label className="GotoBox__label" htmlFor="GotoBox__address">Go to:</label>
				<input type="text" id="GotoBox__address" pattern="(0x)?[0-9A-Fa-f]+" title="Hexadecimal address, enter to submit" />
				<button type="button" className="GotoBox__button">PC</button>
				<button type="button" className="GotoBox__button">RA</button>
			</form>
		);
	}
}

GotoBox.propTypes = {
	gotoDisasm: PropTypes.func.isRequired,
};

export default GotoBox;
