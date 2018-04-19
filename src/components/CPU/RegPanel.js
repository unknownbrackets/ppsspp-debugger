import React, { Component } from 'react';
import RegList from './RegList';
import listeners from '../../utils/listeners.js';
import './RegPanel.css';

class RegPanel extends Component {
	constructor(props) {
		super(props);

		this.state = {
			categories: [],
		};
	}

	render() {
		return (
			<div id="RegPanel">
				{this.state.categories.map(c => c.name)}
				<br />
				{this.state.categories.map(c => <RegList key={c.id} {...c} />)}
			</div>
		);
	}

	componentDidMount() {
		this.listeners_ = listeners.listen({
			'connection': () => this.updateRegs(),
			'cpu.stepping': () => this.updateRegs(),
			'cpu.setReg': (result) => this.updateReg(result),
		});
	}

	componentWillUnmount() {
		listeners.forget(this.listeners_);
	}

	updateRegs() {
		this.props.ppsspp.send({ event: 'cpu.getAllRegs' }).then((result) => {
			let { categories } = result;
			// Add values for change tracking.
			const hasPrev = this.state.categories.length !== 0;
			for (let cat of categories) {
				cat.uintValuesLast = hasPrev ? this.state.categories[cat.id].uintValues : cat.uintValues;
				cat.floatValuesLast = hasPrev ? this.state.categories[cat.id].floatValues : cat.floatValues;
			}
			this.setState({ categories });
		});
	}

	updateReg(result) {
		const replaceCopy = (arr, index, item) => {
			return arr.slice(0, index).concat([item]).concat(arr.slice(index + 1));
		};

		const categories = this.state.categories.map((cat) => {
			if (cat.id === result.category) {
				return {
					...cat,
					uintValuesLast: cat.uintValues,
					floatValuesLast: cat.floatValues,
					uintValues: replaceCopy(cat.uintValues, result.register, result.uintValue),
					floatValues: replaceCopy(cat.floatValues, result.register, result.floatValue),
				};
			}
			return cat;
		});

		this.setState({ categories });
	}
}

RegPanel.defaultProps = {
	ppsspp: null,
	stepping: false,
};

export default RegPanel;
