import React, { Component } from 'react';
import { ContextMenu, MenuItem } from 'react-contextmenu';
import RegList from './RegList';
import listeners from '../../utils/listeners.js';
import './RegPanel.css';
import '../react-contextmenu.css';

class RegPanel extends Component {
	constructor(props) {
		super(props);

		this.state = {
			categories: [],
		};
	}

	render() {
		const disabled = !this.props.stepping;
		return (
			<div id="RegPanel">
				{this.state.categories.map(c => c.name)}
				<br />
				{this.state.categories.map(c => <RegList key={c.id} contextmenu="reglist" {...c} />)}

				<ContextMenu id="reglist">
					<MenuItem data={{ action: 'memory' }} disabled={disabled} onClick={this.handleViewMemory}>
						Go to in Memory View
					</MenuItem>
					<MenuItem data={{ action: 'disasm' }} disabled={disabled} onClick={this.handleViewDisassembly}>
						Go to in Disassembly
					</MenuItem>
					<MenuItem divider />
					<MenuItem data={{ action: 'copy' }} disabled={disabled} onClick={this.handleCopyReg}>
						Copy Value
					</MenuItem>
					<MenuItem data={{ action: 'change' }} disabled={disabled} onClick={this.handleRegAction}>
						Change...
					</MenuItem>
				</ContextMenu>
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

	handleViewMemory(ev, data) {
		// TODO
		console.log(data);
	}

	handleViewDisassembly(ev, data) {
		// TODO
		console.log(data);
	}

	handleCopyReg(ev, data, regNode) {
		const textNode = regNode.querySelector('dd').firstChild;
		const range = document.createRange();
		range.setStart(textNode, 0);
		range.setEnd(textNode, textNode.textContent.length);

		const selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);

		try {
			document.execCommand('copy');
		} catch (e) {
			window.alert('Could not copy: ' + e);
		}

		selection.removeAllRanges();
	}

	handleChangeReg(ev, data) {
		// TODO
		console.log(data);
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
