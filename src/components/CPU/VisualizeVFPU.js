import { PureComponent } from 'react';
import PropTypes from 'prop-types';
import FitModal from '../common/FitModal';
import listeners from '../../utils/listeners';
import { toString08X } from '../../utils/format';
import '../ext/react-modal.css';
import './VisualizeVFPU.css';

// TODO: Consider using react-new-window for desktop?

class VisualizeVFPU extends PureComponent {
	state = {
		categories: [],
		format: 'float',
		transposed: true,
	};
	listeners_;

	render() {
		const { categories, format, transposed } = this.state;
		if (categories.length < 3) {
			return null;
		}

		let matrices = [];
		for (let m = 0; m < categories[2].uintValues.length / 16; ++m) {
			matrices.push(this.renderMatrix(m));
		}

		return (
			<FitModal contentLabel="VFPU" isOpen={this.props.isOpen} onClose={this.props.onClose}>
				<h2>VFPU Registers</h2>
				<div className="VisualizeVFPU__list">
					{matrices}
				</div>
				<div className="VisualizeVFPU__options">
					<div className="VisualizeVFPU__format">
						Display as:
						<label><input type="radio" checked={format === 'float'} value="float" onChange={this.handleFormat} /> Float</label>
						<label><input type="radio" checked={format === 'uint'} value="uint" onChange={this.handleFormat} /> Hex</label>
					</div>
					<div className="VisualizeVFPU__orientation">
						<label><input type="checkbox" checked={transposed} onChange={this.handleOrientation} /> Transposed</label>
					</div>
				</div>
			</FitModal>
		);
	}

	renderMatrix(m) {
		return (
			<table className="VisualizeVFPU__matrix" key={m}>
				<thead>
					{this.renderTopHeaders(m)}
				</thead>
				<tbody>
					{this.renderTableRow(m, 0)}
					{this.renderTableRow(m, 1)}
					{this.renderTableRow(m, 2)}
					{this.renderTableRow(m, 3)}
				</tbody>
			</table>
		);
	}

	renderTopHeaders(m) {
		const { transposed } = this.state;
		if (!transposed) {
			return (
				<tr>
					<th className="VisualizeVFPU__name">M{m}00</th>
					<th className="VisualizeVFPU__row-header">C{m}00</th>
					<th className="VisualizeVFPU__row-header">C{m}10</th>
					<th className="VisualizeVFPU__row-header">C{m}20</th>
					<th className="VisualizeVFPU__row-header">C{m}30</th>
				</tr>
			);
		}

		return (
			<tr>
				<th className="VisualizeVFPU__name">M{m}00</th>
				<th className="VisualizeVFPU__row-header">R{m}00</th>
				<th className="VisualizeVFPU__row-header">R{m}01</th>
				<th className="VisualizeVFPU__row-header">R{m}02</th>
				<th className="VisualizeVFPU__row-header">R{m}03</th>
			</tr>
		);
	}

	renderTableRow(m, c) {
		const { transposed } = this.state;
		if (!transposed) {
			return (
				<tr key={c}>
					<th className="VisualizeVFPU__col-header">R{m}0{c}</th>
					<td>{this.renderValue(m, 0, c)}</td>
					<td>{this.renderValue(m, 1, c)}</td>
					<td>{this.renderValue(m, 2, c)}</td>
					<td>{this.renderValue(m, 3, c)}</td>
				</tr>
			);
		}

		return (
			<tr key={c}>
				<th className="VisualizeVFPU__col-header">C{m}{c}0</th>
				<td>{this.renderValue(m, c, 0)}</td>
				<td>{this.renderValue(m, c, 1)}</td>
				<td>{this.renderValue(m, c, 2)}</td>
				<td>{this.renderValue(m, c, 3)}</td>
			</tr>
		);
	}

	renderValue(m, c, r) {
		const reg = m * 4 + r * 32 + c;
		const cat = this.state.categories[2];
		if (this.state.format === 'uint') {
			return toString08X(cat.uintValues[reg]);
		}
		return cat.floatValues[reg];
	}

	componentDidMount() {
		this.listeners_ = listeners.listen({
			'cpu.getAllRegs': ({ categories }) => this.setState({ categories }),
			'cpu.setReg': ({ category, register, uintValue, floatValue }) => {
				const spliceCopy = (arr, index, value) => [...arr.slice(0, index), value, ...arr.slice(index + 1)];

				if (category !== 2) {
					return;
				}
				this.setState(prevState => {
					const newCategory = {
						...prevState.categories[2],
						uintValues: spliceCopy(prevState.categories[2].uintValues, register, uintValue),
						floatValues: spliceCopy(prevState.categories[2].floatValues, register, floatValue),
					};
					const categories = spliceCopy(prevState.categories, 2, newCategory);
					return { categories };
				});
			},
		});
	}

	componentWillUnmount() {
		listeners.forget(this.listeners_);
	}

	handleFormat = (ev) => {
		const format = ev.target.value;
		this.setState({ format });
	};

	handleOrientation = (ev) => {
		const transposed = ev.target.checked;
		this.setState({ transposed });
	};
}

VisualizeVFPU.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
};

export default VisualizeVFPU;
