import PropTypes from 'prop-types';
import classNames from 'clsx';
import './Form.css';

function Form(props) {
	/* eslint no-script-url: "off" */
	return (
		<form action="#" className={classNames(props.className, 'Form')} onSubmit={props.onSubmit}>
			{props.heading ? <h2 className="Form__heading">{props.heading}</h2> : null}
			{props.children}
		</form>
	);
}

Form.propTypes = {
	onSubmit: PropTypes.func.isRequired,
	className: PropTypes.string,
	children: PropTypes.node.isRequired,
};

Form.Buttons = function (props) {
	const saveHandler = props.onSave !== true ? props.onSave : undefined;
	const saveButton = props.onSave ? <button type="submit" onClick={saveHandler}>Save</button> : null;
	const cancelButton = props.onCancel ? <button type="button" onClick={props.onCancel}>Cancel</button> : null;

	return (
		<div className="Form__buttons">
			{props.children}
			{saveButton}
			{cancelButton}
		</div>
	);
};

Form.Buttons.propTypes = {
	onSave: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
	onCancel: PropTypes.func,
	children: PropTypes.node,
};

export default Form;
