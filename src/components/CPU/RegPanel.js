import React, { Component } from 'react';
import { ContextMenu, MenuItem } from 'react-contextmenu';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import RegList from './RegList';
import listeners from '../../utils/listeners.js';
import './RegPanel.css';
import '../ext/react-contextmenu.css';
import '../ext/react-tabs.css';

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
				{this.renderTabs()}
				{this.renderContextMenu()}
			</div>
		);
	}

	renderTabs() {
		const { categories } = this.state;
		// Seems react-tabs is buggy when tabs are initially empty.
		if (categories.length === 0) {
			return '';
		}

		return (
			<Tabs>
				<TabList>
					{categories.map(c => <Tab key={c.id}>{c.name}</Tab>)}
				</TabList>
				{categories.map(c => (
					<TabPanel key={c.id}>
						<RegList contextmenu="reglist" onDoubleClick={this.handleChangeReg} {...c} />
					</TabPanel>
				))}
			</Tabs>
		);
	}

	renderContextMenu() {
		const disabled = !this.props.stepping;
		return (
			<ContextMenu id="reglist">
				<MenuItem onClick={this.handleViewMemory}>
					Go to in Memory View
				</MenuItem>
				<MenuItem onClick={this.handleViewDisassembly}>
					Go to in Disassembly
				</MenuItem>
				<MenuItem divider />
				<MenuItem onClick={this.handleCopyReg}>
					Copy Value
				</MenuItem>
				<MenuItem disabled={disabled} onClick={this.handleChangeReg}>
					Change...
				</MenuItem>
			</ContextMenu>
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

	handleViewMemory = (ev, data) => {
		// TODO
		console.log(data);
	}

	handleViewDisassembly = (ev, data) => {
		const uintValue = this.state.categories[data.cat].uintValues[data.reg];
		this.props.gotoDisasm(uintValue);
	}

	handleCopyReg = (ev, data, regNode) => {
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
			window.prompt('Register value (use Ctrl-C or Command-C to copy)', data.value);
		}

		selection.removeAllRanges();
	}

	handleChangeReg = (ev, data, regNode) => {
		const prevValue = (data.cat === 0 ? '0x' : '') + data.value;
		const registerName = this.state.categories[data.cat].registerNames[data.reg];

		const newValue = window.prompt('New value for ' + registerName, prevValue);
		if (newValue === null) {
			return;
		}

		const packet = {
			event: 'cpu.setReg',
			category: data.cat,
			register: data.reg,
			value: newValue,
		};

		// The result is automatically listened for.
		this.props.ppsspp.send(packet).catch((err) => {
			window.alert(err);
		});
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
		}, (err) => {
			// Leave regs alone.
			console.error(err);
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
					// Keep values from last time, until next stepping.
					uintValuesLast: cat.uintValuesLast,
					floatValuesLast: cat.floatValuesLast,
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
	log: null,
	stepping: false,
	gotoDisasm: null,
};

export default RegPanel;
