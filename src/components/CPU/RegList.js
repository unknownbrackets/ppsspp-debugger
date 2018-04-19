import React, { Component } from 'react';

class RegList extends Component {
	render() {
		return (
			<dl>
				{this.props.registerNames.map((name, reg) => {
					return [
						<dt key={`dt-${reg}`}>{name}</dt>,
						<dd key={`dd-${reg}`} class={this.changed(reg) ? 'RegPanel__changed' : ''}>
							{this.format(reg)}
						</dd>
					];
				})}
			</dl>
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
	registerNames: [],
	uintValues: [],
	floatValues: [],
	uintValuesLast: [],
	floatValuesLast: [],
};

export default RegList;
