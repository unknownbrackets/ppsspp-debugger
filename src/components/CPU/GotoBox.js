import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import './GotoBox.css';

class GotoBox extends PureComponent {
	state = {
		address: '',
	};
	ref;

	constructor(props) {
		super(props);
		this.ref = React.createRef();
	}

	render() {
		/* eslint no-script-url: "off" */
		const disabled = !this.props.started;
		return (
			<form action="javascript://" className="GotoBox" onSubmit={this.handleSubmit}>
				<label className="GotoBox__label" htmlFor="GotoBox__address">Go to:</label>
				<input ref={this.ref}
					type="text" id="GotoBox__address"
					value={this.state.address} onChange={this.handleChange}
					title="Hexadecimal address or expression, enter to submit"
					autoComplete="off"
				/>
				<button type="button" className="GotoBox__button" onClick={this.handlePC} disabled={disabled}>PC</button>
				<button type="button" className="GotoBox__button" onClick={this.handleRA} disabled={disabled}>RA</button>
			</form>
		);
	}

	componentDidUpdate(prevProps, prevState) {
		if (this.props.promptGotoMarker !== prevProps.promptGotoMarker) {
			this.ref.current.focus();
			this.ref.current.select();
		}
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
				thread: this.props.currentThread,
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
	started: PropTypes.bool.isRequired,
	currentThread: PropTypes.number,

	gotoDisasm: PropTypes.func.isRequired,
};

export default GotoBox;
