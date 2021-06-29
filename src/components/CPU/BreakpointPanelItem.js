import { ContextMenuTrigger } from 'react-contextmenu';
import PropTypes from 'prop-types';
import { toString08X } from '../../utils/format';
import './BreakpointPanelItem.css';

export default function BreakpointPanelItem(props) {
	const { breakpoint, selected } = props;

	const mapData = (props) => {
		return { breakpoint: breakpoint };
	};
	const attributes = {
		onDoubleClick: () => {
			props.gotoBreakpoint(breakpoint);
			return false;
		},
		onMouseDown: () => {
			props.onSelect();
			return false;
		},
		className: selected ? 'BreakpointPanelItem--selected' : null,
	};

	const breakCheckbox = (
		<td className="BreakpointPanelItem__break-check-cell">
			<input type="checkbox" checked={breakpoint.enabled} className="BreakpointPanelItem__break-check" onChange={() => props.toggleBreakpoint(breakpoint)} />
		</td>
	);

	if (breakpoint.type === 'execute') {
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
	} else if (breakpoint.type === 'memory') {
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
	selected: PropTypes.bool.isRequired,
	gotoBreakpoint: PropTypes.func.isRequired,

	toggleBreakpoint: PropTypes.func.isRequired,
	onSelect: PropTypes.func.isRequired,
};
