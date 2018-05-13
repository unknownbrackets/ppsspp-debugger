import React, { PureComponent } from 'react';
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
	};
	listeners_;

	render() {
		const { categories, format } = this.state;
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
				<div className="VisualizeVFPU__format">
					Display as:
					<label><input type="radio" checked={format === 'float'} value="float" onChange={this.handleFormat} /> Float</label>
					<label><input type="radio" checked={format === 'uint'} value="uint" onChange={this.handleFormat} /> Hex</label>
				</div>
			</FitModal>
		);
	}

	renderMatrix(m) {
		return (
			<table className="VisualizeVFPU__matrix" key={m}>
				<thead>
					<tr>
						<th className="VisualizeVFPU__name">M{m}00</th>
						<th className="VisualizeVFPU__row-header">R{m}00</th>
						<th className="VisualizeVFPU__row-header">R{m}01</th>
						<th className="VisualizeVFPU__row-header">R{m}02</th>
						<th className="VisualizeVFPU__row-header">R{m}03</th>
					</tr>
				</thead>
				<tbody>
					{this.renderColumn(m, 0)}
					{this.renderColumn(m, 1)}
					{this.renderColumn(m, 2)}
					{this.renderColumn(m, 3)}
				</tbody>
			</table>
		);
	}

	renderColumn(m, c) {
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
		const reg = m * 4 + c * 32 + r;
		const cat = this.state.categories[2];
		if (this.state.format === 'uint') {
			return toString08X(cat.uintValues[reg]);
		}
		return cat.floatValues[reg];
	}

	componentDidMount() {
		this.listeners_ = listeners.listen({
			'cpu.getAllRegs': ({ categories }) => this.setState({ categories }),
		});
	}

	componentWillUnmount() {
		listeners.forget(this.listeners_);
	}

	handleFormat = (ev) => {
		const format = ev.target.value;
		this.setState({ format });
	}
}

VisualizeVFPU.propTypes = {
	ppsspp: PropTypes.object.isRequired,
	log: PropTypes.func.isRequired,
	isOpen: PropTypes.bool.isRequired,

	onClose: PropTypes.func.isRequired,
};

export default VisualizeVFPU;
