import { Component } from 'react';
import PropTypes from 'prop-types';

class Field extends Component {
	render() {
		const { label, children } = this.props;
		return (
			<div className="Field">
				<label className="Field__label" htmlFor={this.fieldID()}>{label}</label>
				{this.renderInput()}
				{children}
			</div>
		);
	}

	renderInput() {
		if (this.props.type === 'text') {
			return this.renderText();
		} else if (this.props.type === 'hex') {
			return this.renderHex();
		} else if (this.props.type === 'radio') {
			return this.renderRadio();
		} else if (this.props.type === 'checkboxes') {
			return this.renderCheckboxes();
		} else {
			return null;
		}
	}

	renderText(other = {}) {
		let { label, type, children, onChange, component, prop, ...primary } = this.props;
		primary.value = this.fieldValue();
		return <input type="text" id={this.fieldID()} onChange={this.handleChange} {...primary} {...other} />;
	}

	renderHex() {
		return this.renderText({ pattern: '(0x)?[0-9A-Fa-f]+', title: 'Hexadecimal value' });
	}

	renderRadio() {
		const value = this.fieldValue();
		return this.props.options.map(option => {
			const props = {
				name: this.fieldID(),
				value: option.value,
				checked: value === option.value,
				onChange: this.handleChange,
				disabled: this.props.disabled,
			};
			return (
				<label key={option.value}>
					<input type="radio" {...props} />
					{' ' + option.label}
				</label>
			);
		});
	}

	renderCheckboxes() {
		return this.props.options.map(option => {
			const props = {
				'data-prop': option.value,
				checked: this.props.component.state[option.value],
				onChange: this.handleChange,
				disabled: this.props.disabled,
			};
			return (
				<label key={option.value}>
					<input type="checkbox" {...props} />
					{' ' + option.label}
				</label>
			);
		});
	}

	fieldID() {
		const { id, component, prop } = this.props;
		if (!id && component && prop) {
			return (component.displayName || component.constructor.name) + '__' + prop;
		}
		return id;
	}

	fieldValue() {
		const { value, component, prop } = this.props;
		if (value === undefined && component && prop) {
			return component.state[prop];
		}
		return value;
	}

	handleChange = (ev) => {
		if (this.props.onChange) {
			this.props.onChange(ev);
		} else if (this.props.component) {
			const { target } = ev;
			const prop = target.dataset.prop || this.props.prop;
			const value = target.type === 'checkbox' ? target.checked : target.value;
			this.props.component.setState({ [prop]: value });
		}
	};
}

Field.propTypes = {
	id: PropTypes.string,
	label: PropTypes.node.isRequired,
	type: PropTypes.oneOf(['text', 'hex', 'radio', 'checkboxes']),
	component: PropTypes.object,
	value: PropTypes.string,
	prop: PropTypes.string,
	options: PropTypes.arrayOf(PropTypes.shape({
		label: PropTypes.string.isRequired,
		value: PropTypes.string.isRequired,
	})),
	disabled: PropTypes.bool,
	onChange: PropTypes.func,
	children: PropTypes.node,
};

export default Field;
