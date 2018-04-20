import React, { Component } from 'react';
import { ContextMenuTrigger } from 'react-contextmenu';

class RegList extends Component {
	render() {
		return (
			<dl key="dl">
				{this.props.registerNames.map((name, reg) => {
					return this.renderReg(name, reg);
				})}
			</dl>
		);
	}

	renderReg(name, reg) {
		const mapData = (props) => {
			return { cat: this.props.id, reg, value: this.format(reg) };
		};
		const attributes = {
			onDoubleClick: (ev) => this.props.onDoubleClick(ev, mapData()),
		};
		return (
			<ContextMenuTrigger id={this.props.contextmenu} renderTag="a" attributes={attributes} collect={mapData} key={reg}>
				<dt>{name}</dt>
				<dd className={this.changed(reg) ? 'RegPanel__changed' : ''}>
					{this.format(reg)}
				</dd>
			</ContextMenuTrigger>
		);
	}

	format(reg) {
		if (this.props.id === 0) {
			const hex = this.props.uintValues[reg].toString(16).toUpperCase();
			// Pad to 8 characters.
			return ('00000000' + hex).substr(-8);
		} else {
			return this.props.floatValues[reg];
		}
	}

	changed(reg) {
		return this.props.uintValues[reg] !== this.props.uintValuesLast[reg];
	}
}

RegList.defaultProps = {
	id: null,
	contextmenu: null,
	onDoubleClick: null,
	registerNames: [],
	uintValues: [],
	floatValues: [],
	uintValuesLast: [],
	floatValuesLast: [],
};

export default RegList;
