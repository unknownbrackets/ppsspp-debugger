import { PureComponent } from 'react';
import DebuggerContext, { DebuggerContextValues } from '../DebuggerContext';
import PropTypes from 'prop-types';
import FitModal from '../common/FitModal';
import Field from '../common/Field';
import Form from '../common/Form';
import { Timeout } from '../../utils/timeouts';
import { toString08X } from '../../utils/format';
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
	{ label: 'Break', value: 'enabled' },
	{ label: 'Log', value: 'log' },
];

class BreakpointModal extends PureComponent {
	state = {};
	/**
	 * @type {DebuggerContextValues}
	 */
	context;
	cleanState = {
		isOpen: false,
		derivedBreakpoint: null,
	};
	cleanBreakpoint = {
		type: 'memory',
		address: '',
		size: '0x00000001',
		condition: '',
		logFormat: '',
		read: true,
		write: true,
		change: false,
		enabled: true,
		log: true,
	};
	cleanTimeout;

	constructor(props) {
		super(props);
		Object.assign(this.state, { ...this.cleanState, ...this.cleanBreakpoint, ...props.breakpoint, ...props.initialOverrides });

		this.cleanTimeout = new Timeout(() => {
			this.setState({ ...this.cleanState, ...this.cleanBreakpoint, ...this.props.breakpoint, ...this.props.initialOverrides });
		}, 200);
	}

	render() {
		const editing = !!this.props.breakpoint;

		return (
			<FitModal
				contentLabel="Breakpoint settings"
				isOpen={this.props.isOpen}
				onClose={this.onClose}
				confirmClose={this.hasChanges() ? 'Discard changes?' : null}
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
			<>
				<Field type="hex" label="Size" prop="size" component={this} />
				<Field type="checkboxes" label="Operations" options={operationOptions} component={this} />
			</>
		);
	}

	renderExecute() {
		if (this.state.type !== 'execute') {
			return null;
		}
		return (
			<Field type="text" label="Condition" prop="condition" component={this} />
		);
	}

	hasChanges() {
		const compareTo = this.state.derivedBreakpoint || this.cleanBreakpoint;
		return Object.keys(compareTo).find(key => this.state[key] !== compareTo[key]) !== undefined;
	}

	componentDidUpdate(prevProps, prevState) {
		if (this.props.isOpen && this.cleanTimeout != null) {
			this.cleanTimeout.runEarly();
		}
	}

	onSave = (e) => {
		let operation = this.context.ppsspp.send({
			event: 'cpu.evaluate',
			thread: this.context.gameStatus.currentThread,
			expression: this.state.address,
		});

		if (this.props.breakpoint) {
			const { derivedBreakpoint, address, size, type } = this.state;
			if (type !== derivedBreakpoint.type || derivedBreakpoint.address !== address) {
				operation = operation.then(this.deleteOld).then(this.saveNew);
			} else if (type === 'memory' && derivedBreakpoint.size !== size) {
				operation = operation.then(this.deleteOld).then(this.saveNew);
			} else {
				operation = operation.then(this.updateExisting);
			}
		} else {
			operation = operation.then(this.saveNew);
		}

		operation.then(this.onClose, err => {
			window.alert(err.message);
		});

		e.preventDefault();
	};

	saveNew = ({ uintValue }) => {
		return this.context.ppsspp.send({
			event: this.getEvent(this.state.type, 'add'),
			...this.state,
			address: uintValue,
		});
	};

	deleteOld = ({ uintValue }) => {
		// This is used when changing the breakpoint type.
		return this.context.ppsspp.send({
			event: this.getEvent(this.props.breakpoint.type, 'remove'),
			address: this.props.breakpoint.address,
			size: this.props.breakpoint.size,
		}).then(() => {
			// Return the original new address for easy sequencing.
			return { uintValue };
		});
	};

	updateExisting = ({ uintValue }) => {
		return this.context.ppsspp.send({
			event: this.getEvent(this.state.type, 'update'),
			...this.state,
			address: uintValue,
		});
	};

	getEvent(type, event) {
		if (type === 'execute') {
			return 'cpu.breakpoint.' + event;
		} else if (type === 'memory') {
			return 'memory.breakpoint.' + event;
		} else {
			throw new Error('Unexpected type: ' + type);
		}
	}

	onClose = () => {
		this.cleanTimeout.start();
		this.props.onClose();
	};

	static getDerivedStateFromProps(nextProps, prevState) {
		if (nextProps.isOpen && !prevState.isOpen) {
			const derivedBreakpoint = nextProps.breakpoint;
			if (derivedBreakpoint) {
				// This is the "derived" unchanged state for the "Discard changes?" prompt, and initial state.
				derivedBreakpoint.address = '0x' + toString08X(derivedBreakpoint.address);
				if (derivedBreakpoint.size) {
					derivedBreakpoint.size = '0x' + toString08X(derivedBreakpoint.size);
				}
				derivedBreakpoint.condition = derivedBreakpoint.condition || '';
				derivedBreakpoint.logFormat = derivedBreakpoint.logFormat || '';
			}
			const initialOverrides = nextProps.initialOverrides;
			if (initialOverrides) {
				initialOverrides.address = '0x' + toString08X(initialOverrides.address);
				if (initialOverrides.size) {
					initialOverrides.size = '0x' + toString08X(initialOverrides.size);
				}
			}
			return { isOpen: true, ...derivedBreakpoint, derivedBreakpoint, ...initialOverrides };
		}
		if (!nextProps.isOpen && prevState.derivedBreakpoint) {
			return { derivedBreakpoint: null };
		}
		return null;
	}
}

BreakpointModal.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	breakpoint: PropTypes.shape({
		type: PropTypes.oneOf(['execute', 'memory']),
		address: PropTypes.number.isRequired,
	}),
	initialOverrides: PropTypes.shape({
		type: PropTypes.oneOf(['execute', 'memory']),
		address: PropTypes.number.isRequired,
	}),

	onClose: PropTypes.func.isRequired,
};

BreakpointModal.contextType = DebuggerContext;

export default BreakpointModal;
