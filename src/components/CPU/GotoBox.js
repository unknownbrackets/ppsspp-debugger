import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import './GotoBox.css';

class GotoBox extends PureComponent {
	state = {
		address: '',
	};

	render() {
		/* eslint no-script-url: "off" */
		const disabled = !this.props.started;
		return (
			<form action="javascript://" className="GotoBox" onSubmit={this.handleSubmit}>
				<label className="GotoBox__label" htmlFor="GotoBox__address">Go to:</label>
				<input
					type="text" id="GotoBox__address"
					value={this.state.address} onChange={this.handleChange}
					title="Hexadecimal address, enter to submit"
					autoComplete="off"
				/>
				<button type="button" className="GotoBox__button" onClick={this.handlePC} disabled={disabled}>PC</button>
				<button type="button" className="GotoBox__button" onClick={this.handleRA} disabled={disabled}>RA</button>
			</form>
		);
	}

	jumpToReg(name) {
		this.props.ppsspp.send({
			event: 'cpu.getReg',
			name,
		}).then((result) => {
			if (this.props.started) {
				this.props.gotoDisasm(result.uintValue);
			}
		});
	}

	handleChange = (ev) => {
		this.setState({ address: ev.target.value });
	}

	handleSubmit = (ev) => {
		if (this.props.started) {
			this.props.ppsspp.send({
				event: 'cpu.evaluate',
				expression: this.state.address,
			}).then(({ uintValue }) => {
				if (this.props.started) {
					this.props.gotoDisasm(uintValue);
				}
			});
		}
		ev.preventDefault();
	}

	handlePC = (ev) => {
		this.jumpToReg('pc');
	}

	handleRA = (ev) => {
		this.jumpToReg('ra');
	}
}

GotoBox.propTypes = {
	ppsspp: PropTypes.object.isRequired,
	gotoDisasm: PropTypes.func.isRequired,
	started: PropTypes.bool.isRequired,
};

export default GotoBox;
