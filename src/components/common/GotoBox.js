import { createRef, PureComponent } from 'react';
import DebuggerContext, { DebuggerContextValues } from '../DebuggerContext';
import PropTypes from 'prop-types';
import './GotoBox.css';

class GotoBox extends PureComponent {
	state = {
		address: '',
	};
	/**
	 * @type {DebuggerContextValues}
	 */
	context;
	ref;
	id;

	constructor(props) {
		super(props);
		this.ref = createRef();
		this.id = 'GotoBox__address--' + Math.random().toString(36).substr(2, 9);
	}

	render() {
		return (
			<form action="#" className="GotoBox" onSubmit={this.handleSubmit}>
				<label className="GotoBox__label" htmlFor={this.id}>Go to:</label>
				<input ref={this.ref}
					type="text" id={this.id}
					className="GotoBox__address"
					value={this.state.address} onChange={this.handleChange}
					title="Hexadecimal address or expression, enter to submit"
					autoComplete="off"
				/>
				{this.renderPCButtons()}
			</form>
		);
	}

	renderPCButtons() {
		if (!this.includePC) {
			return null;
		}
		const disabled = !this.context.gameStatus.started;
		return (
			<>
				<button type="button" className="GotoBox__button" onClick={this.handlePC} disabled={disabled}>PC</button>
				<button type="button" className="GotoBox__button" onClick={this.handleRA} disabled={disabled}>RA</button>
			</>
		);
	}

	componentDidUpdate(prevProps, prevState) {
		if (this.props.promptGotoMarker !== prevProps.promptGotoMarker) {
			this.ref.current.focus();
			this.ref.current.select();
		}
	}

	jumpToReg(name) {
		this.context.ppsspp.send({
			event: 'cpu.getReg',
			name,
		}).then((result) => {
			if (this.context.gameStatus.started) {
				this.props.gotoAddress(result.uintValue);
			}
		});
	}

	handleChange = (ev) => {
		this.setState({ address: ev.target.value });
	}

	handleSubmit = (ev) => {
		if (this.context.gameStatus.started) {
			this.context.ppsspp.send({
				event: 'cpu.evaluate',
				thread: this.context.gameStatus.currentThread,
				expression: this.state.address,
			}).then(({ uintValue }) => {
				if (this.context.gameStatus.started) {
					this.props.gotoAddress(uintValue);
				}
			}, err => {
				// Probably a bad reference.
				this.ref.current.focus();
				this.ref.current.select();
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
	includePC: PropTypes.bool.isRequired,
	promptGotoMarker: PropTypes.any,
	gotoAddress: PropTypes.func.isRequired,
};

GotoBox.contextType = DebuggerContext;

export default GotoBox;
