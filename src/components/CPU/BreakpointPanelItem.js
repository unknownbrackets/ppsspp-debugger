import React from 'react';
import PropTypes from 'prop-types';
import './BreakpointPanelItem.css';
import { toString08X } from '../../utils/format';
import { ContextMenuTrigger } from 'react-contextmenu';

export default function BreakpointPanelItem(props) {
	const { breakpoint, type, selected } = props;

	const mapData = (props) => {
		return { breakpoint: breakpoint, type: type };
	};
	const attributes = {
		onDoubleClick: () => {
			if (type === 'memory') {
				// TODO: Go to address in memory view (whenever it's implemented)
			} else if (type === 'execute') {
				props.gotoDisasm(breakpoint.address);
			}
			return false;
		},
		onMouseDown: () => {
			props.onSelect();
			return false;
		},
		className: selected ? 'BreakpointPanelItem--selected' : null
	};

	const breakCheckbox = (
		<td className="BreakpointPanelItem__break-check-cell">
			<input type="checkbox" checked={breakpoint.enabled} className="BreakpointPanelItem__break-check" onChange={() => props.handleToggleBreakpoint(breakpoint, type)}/>
		</td>
	);

	if (type === 'memory') {
		return (
			<ContextMenuTrigger id="breakpointPanel" renderTag="tr" holdToDisplay={-1} attributes={attributes} collect={mapData}>
				{breakCheckbox}
				<td>{mapMemoryBreakpointType(breakpoint)}</td>
				<td>0x{toString08X(breakpoint.address)}</td>
				<td>0x{toString08X(breakpoint.size)}</td>
				<td>{breakpoint.code || '-'}</td>
				<td>{breakpoint.condition || '-'}</td>
				<td>{breakpoint.hits}</td>
			</ContextMenuTrigger>
		);
	} else if (type === 'execute') {
		return (
			<ContextMenuTrigger id="breakpointPanel" renderTag="tr" holdToDisplay={-1} attributes={attributes} collect={mapData}>
				{breakCheckbox}
				<td>Execute</td>
				<td>0x{toString08X(breakpoint.address)}</td>
				<td>{breakpoint.symbol || '-'}</td>
				<td>{breakpoint.code || '-'}</td>
				<td>{breakpoint.condition || '-'}</td>
				<td>-</td>
			</ContextMenuTrigger>
		);
	} else {
		return null;
	}
}

function mapMemoryBreakpointType(breakpoint) {
	const { write, read, change } = breakpoint;

	if ((!read && !write) || (!write && read && change)) {
		return 'Invalid';
	}

	let type;
	if (read && write) {
		type = 'Read/Write';
	} else if (read) {
		type = 'Read';
	} else if (write) {
		type = 'Write';
	}

	if (change) {
		return type + ' Change';
	} else {
		return type;
	}
}

BreakpointPanelItem.propTypes = {
	breakpoint: PropTypes.object.isRequired,
	type: PropTypes.oneOf(['execute', 'memory']).isRequired,
	selected: PropTypes.bool.isRequired,
	gotoDisasm: PropTypes.func.isRequired,

	toggleBreakpoint: PropTypes.func.isRequired,
	onSelect: PropTypes.func.isRequired,
};
