import React, { Component } from 'react';
import { ContextMenuTrigger } from 'react-contextmenu';
import { toString08X } from '../../utils/format';
import classNames from 'classnames';

class RegList extends Component {
	constructor(props) {
		super(props);

		this.state = {
			cursor: 0,
		};
	}

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
			onDoubleClick: (ev) => this.onDoubleClick(ev, mapData()),
			onMouseDown: (ev) => this.setState({ cursor: reg }),
		};
		const ddClasses = {
			'RegPanel__item--changed': this.changed(reg),
			'RegPanel__item--selected': this.state.cursor === reg,
		};

		return (
			<ContextMenuTrigger id={this.props.contextmenu} renderTag="a" attributes={attributes} collect={mapData} key={reg}>
				<dt>{name}</dt>
				<dd className={classNames(ddClasses)}>
					{this.format(reg)}
				</dd>
			</ContextMenuTrigger>
		);
	}

	format(reg) {
		if (this.props.id === 0) {
			return toString08X(this.props.uintValues[reg]);
		} else {
			return this.props.floatValues[reg];
		}
	}

	changed(reg) {
		return this.props.uintValues[reg] !== this.props.uintValuesLast[reg];
	}

	onDoubleClick = (ev, data) => {
		if (ev.button === 0) {
			this.props.onDoubleClick(ev, data);
		}
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
