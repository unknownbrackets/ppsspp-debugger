import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import FitModal from '../common/FitModal';
import Field from '../common/Field';
import Form from '../common/Form';
import '../ext/react-modal.css';
import './BreakpointModal.css';

const typeOptions = [
	{ label: 'Memory', value: 'memory' },
	{ label: 'Execute', value: 'execute' },
];

const operationOptions = [
	{ label: 'Read', value: 'read' },
	{ label: 'Write', value: 'write' },
	{ label: 'On change', value: 'change' },
];

const actionOptions = [
	{ label: 'Break', value: 'break' },
	{ label: 'Log', value: 'log' },
];

class BreakpointModal extends PureComponent {
	state = {};
	cleanState = {
		type: 'memory',
		address: '',
		size: '0x00000001',
		condition: '',
		logFormat: '',
		read: true,
		write: true,
		change: false,
		break: true,
		log: true,
	};

	constructor(props) {
		super(props);
		Object.assign(this.state, this.cleanState);
	}

	render() {
		// TODO
		const editing = false;

		return (
			<FitModal
				contentLabel="Breakpoint settings"
				isOpen={this.props.isOpen}
				onClose={this.onClose}
				confirmClose={this.state.address.length > 0 ? 'Discard changes?' : null}
			>
				<Form heading={editing ? 'Edit Breakpoint' : 'Create Breakpoint'} onSubmit={this.onSave} className="BreakpointModal">
					<Field type="radio" label="Type" options={typeOptions} prop="type" component={this} />
					<Field type="text" label="Address" prop="address" component={this} />
					{this.renderMemory()}
					{this.renderExecute()}
					<Field type="text" label="Log format" prop="logFormat" component={this} disabled={!this.state.log} />
					<Field type="checkboxes" label="Actions" options={actionOptions} component={this} />

					<Form.Buttons onSave={true} onCancel={this.onClose} />
				</Form>
			</FitModal>
		);
	}

	renderMemory() {
		if (this.state.type !== 'memory') {
			return null;
		}
		return (
			<React.Fragment>
				<Field type="hex" label="Size" prop="size" component={this} />
				<Field type="checkboxes" label="Operations" options={operationOptions} component={this} />
			</React.Fragment>
		);
	}

	renderExecute() {
		if (this.state.type !== 'execute') {
			return null;
		}
		return (
			<React.Fragment>
				<Field type="text" label="Condition" prop="condition" component={this} />
			</React.Fragment>
		);
	}

	onSave = () => {
		// TODO
		this.onClose();
	}

	onClose = () => {
		this.setState(this.cleanState);
		this.props.onClose();
	}
}

BreakpointModal.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
};

export default BreakpointModal;
