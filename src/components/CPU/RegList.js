import React, { Component } from 'react';
import { ContextMenuTrigger } from 'react-contextmenu';
import { toString08X } from '../../utils/format';
import { ensureInView } from '../../utils/dom';
import classNames from 'classnames';

class RegList extends Component {
	constructor(props) {
		super(props);

		this.cursorRef = React.createRef();
		this.state = {
			cursor: 0,
		};
		this.needsScroll = false;
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
			onKeyDown: (ev) => this.onKeyDown(ev),
			tabIndex: 0,
		};
		const ddClasses = {
			'RegPanel__item--changed': this.changed(reg),
			'RegPanel__item--selected': this.state.cursor === reg,
		};
		const ref = this.state.cursor === reg ? this.cursorRef : undefined;

		return (
			<ContextMenuTrigger id={this.props.contextmenu} renderTag="a" attributes={attributes} collect={mapData} key={reg}>
				<dt>{name}</dt>
				<dd className={classNames(ddClasses)} ref={ref}>
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

	componentDidUpdate(prevProps, prevState) {
		// Always associated with a state update.
		if (this.needsScroll && this.cursorRef.current) {
			ensureInView(this.cursorRef.current, { block: 'nearest' });
			this.needsScroll = false;
		}
	}

	onDoubleClick = (ev, data) => {
		if (ev.button === 0) {
			this.props.onDoubleClick(ev, data);
		}
	}

	onKeyDown(ev) {
		if (ev.key === 'ArrowUp' && this.state.cursor > 0) {
			this.needsScroll = true;
			this.setState({ cursor: this.state.cursor - 1 });
			ev.preventDefault();
		}
		if (ev.key === 'ArrowDown' && this.state.cursor < this.props.registerNames.length - 1) {
			this.needsScroll = true;
			this.setState({ cursor: this.state.cursor + 1 });
			ev.preventDefault();
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
