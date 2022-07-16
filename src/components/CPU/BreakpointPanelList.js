import { useState } from 'react';
import { ContextMenuTrigger } from 'react-contextmenu';
import PropTypes from 'prop-types';
import { useDebuggerContext } from '../DebuggerContext';
import { hasContextMenu } from '../../utils/dom';
import BreakpointModal from './BreakpointModal';
import BreakpointPanelContextMenu from './BreakpointPanelContextMenu';
import BreakpointPanelItem from './BreakpointPanelItem';
import './BreakpointPanelList.css';

export default function BreakpointPanelList(props) {
	const context = useDebuggerContext();

	const { breakpoints, selectedRow, setSelectedRow, gotoDisasm } = props;

	const [editingBreakpoint, setEditingBreakpoint] = useState(null);
	const [creatingBreakpoint, setCreatingBreakpoint] = useState(false);

	const handleToggleBreakpoint = (breakpoint) => {
		if (breakpoint.type === 'execute') {
			context.ppsspp.send({
				event: 'cpu.breakpoint.update',
				address: breakpoint.address,
				enabled: !breakpoint.enabled,
			});
		} else if (breakpoint.type === 'memory') {
			context.ppsspp.send({
				event: 'memory.breakpoint.update',
				address: breakpoint.address,
				size: breakpoint.size,
				enabled: !breakpoint.enabled,
			});
		}
	};

	const handleRemoveBreakpoint = (breakpoint) => {
		if (breakpoint.type === 'execute') {
			context.ppsspp.send({
				event: 'cpu.breakpoint.remove',
				address: breakpoint.address,
			});
		} else if (breakpoint.type === 'memory') {
			context.ppsspp.send({
				event: 'memory.breakpoint.remove',
				address: breakpoint.address,
				size: breakpoint.size,
			});
		}
	};

	const handleGotoBreakpoint = (breakpoint) => {
		if (breakpoint.type === 'execute') {
			gotoDisasm(breakpoint.address);
		} else if (breakpoint.type === 'memory') {
			// TODO: Go to address in memory view (whenever it's implemented)
		}
	};

	const handleCloseBreakpointModal = () => {
		setEditingBreakpoint(null);
		setCreatingBreakpoint(false);
	};

	const onKeyDown = (ev) => {
		if (hasContextMenu()) {
			return;
		}

		if (ev.key === 'ArrowUp' && selectedRow > 0) {
			setSelectedRow(selectedRow - 1);
			ev.preventDefault();
		}
		if (ev.key === 'ArrowDown' && selectedRow < breakpoints.length - 1) {
			setSelectedRow(selectedRow + 1);
			ev.preventDefault();
		}

		const selectedBreakpoint = breakpoints[selectedRow];
		if (!selectedBreakpoint) {
			return;
		}
		if (ev.key === 'ArrowRight') {
			handleGotoBreakpoint(selectedBreakpoint);
			ev.preventDefault();
		}
		if (ev.key === ' ') {
			handleToggleBreakpoint(selectedBreakpoint);
			ev.preventDefault();
		}
		if (ev.key === 'Enter') {
			setEditingBreakpoint(selectedBreakpoint);
			ev.preventDefault();
		}
		if (ev.key === 'Delete') {
			handleRemoveBreakpoint(selectedBreakpoint);
			ev.preventDefault();
		}
	};

	return (
		<>
			<ContextMenuTrigger id="breakpointPanel" renderTag="div" holdToDisplay={-1} attributes={{ id: 'BreakpointPanelList' }}>
				<table className="BreakpointPanelList__table" onKeyDown={onKeyDown} tabIndex={0}>
					<thead>
						<tr>
							<th>Break</th>
							<th>Type</th>
							<th>Offset</th>
							<th>Size/Label</th>
							<th>Opcode</th>
							<th>Condition</th>
							<th>Hits</th>
						</tr>
					</thead>
					<colgroup>
						<col className="BreakpointPanelList__table-column-break" />
						<col className="BreakpointPanelList__table-column-type" />
						<col className="BreakpointPanelList__table-column-offset" />
						<col className="BreakpointPanelList__table-column" />
						<col className="BreakpointPanelList__table-column" />
						<col className="BreakpointPanelList__table-column" />
						<col className="BreakpointPanelList__table-column-hits" />
					</colgroup>
					<tbody>
						{breakpoints.map((breakpoint, index) =>
							<BreakpointPanelItem
								key={`${breakpoint.address}-${breakpoint.size || 0}`}
								breakpoint={breakpoint}
								selected={index === selectedRow}
								gotoBreakpoint={handleGotoBreakpoint}
								toggleBreakpoint={handleToggleBreakpoint}
								onSelect={() => setSelectedRow(index)} />
						)}
					</tbody>
				</table>
				{breakpoints.length === 0 ?
					<div className="BreakpointPanelList__no-breakpoints">No breakpoints set</div>
					: null}
			</ContextMenuTrigger>
			<BreakpointModal
				isOpen={!!(editingBreakpoint || creatingBreakpoint)}
				onClose={handleCloseBreakpointModal}
				breakpoint={editingBreakpoint}
			/>
			<BreakpointPanelContextMenu
				toggleBreakpoint={handleToggleBreakpoint}
				editBreakpoint={(breakpoint) => setEditingBreakpoint(breakpoint)}
				removeBreakpoint={handleRemoveBreakpoint}
				createBreakpoint={() => setCreatingBreakpoint(true)} />
		</>
	);
}

BreakpointPanelList.propTypes = {
	breakpoints: PropTypes.arrayOf(PropTypes.object).isRequired,
	selectedRow: PropTypes.number.isRequired,
	setSelectedRow: PropTypes.func.isRequired,
	gotoDisasm: PropTypes.func.isRequired,
};
