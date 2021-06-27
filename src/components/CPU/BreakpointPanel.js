import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './BreakpointPanel.css';
import { ContextMenuTrigger } from 'react-contextmenu';
import listeners from '../../utils/listeners';
import BreakpointContextMenu from './BreakpointPanelContextMenu';
import BreakpointModal from './BreakpointModal';
import BreakpointPanelItem from './BreakpointPanelItem';
import { hasContextMenu } from '../../utils/dom';
import { useDebuggerContext } from '../DebuggerContext';

export default function BreakpointPanel(props) {
	const context = useDebuggerContext();

	const [cpuBreakpoints, setCpuBreakpoints] = useState([]);
	const [memoryBreakpoints, setMemoryBreakpoints] = useState([]);
	const [editingBreakpoint, setEditingBreakpoint] = useState(null);
	const [creatingBreakpoint, setCreatingBreakpoint] = useState(false);
	const [selectedRow, setSelectedRow] = useState(-1);

	const breakpoints = [...memoryBreakpoints, ...cpuBreakpoints];

	const fetchCpuBreakpoints = useCallback(() => {
		if (!context.gameStatus.started) {
			return;
		}
		context.ppsspp.send({
			event: 'cpu.breakpoint.list',
		}).then(({ breakpoints }) => {
			setCpuBreakpoints(breakpoints);
		}, () => {
			setCpuBreakpoints([]);
		});
	}, [context.ppsspp, context.gameStatus.started]);

	const fetchMemoryBreakpoints = useCallback(() => {
		if (!context.gameStatus.started) {
			return;
		}
		context.ppsspp.send({
			event: 'memory.breakpoint.list',
		}).then(({ breakpoints }) => {
			setMemoryBreakpoints(breakpoints);
		}, () => {
			setMemoryBreakpoints([]);
		});
	}, [context.ppsspp, context.gameStatus.started]);

	const fetchBreakpoints = useCallback(() => {
		fetchCpuBreakpoints();
		fetchMemoryBreakpoints();
	}, [fetchCpuBreakpoints, fetchMemoryBreakpoints]);

	const clearBreakpoints = useCallback(() => {
		setCpuBreakpoints([]);
		setMemoryBreakpoints([]);
		setSelectedRow(-1);
	}, []);

	useEffect(() => {
		const interval = setInterval(() => {
			fetchBreakpoints();
		}, 3000);
		return () => clearInterval(interval);
	}, [fetchBreakpoints]);

	useEffect(() => {
		const listeners_ = listeners.listen({
			'game.start': () => fetchBreakpoints(),
			'game.quit': () => clearBreakpoints(),
			'connection': () => fetchBreakpoints(),
			'cpu.stepping': () => fetchBreakpoints(),
			'cpu.breakpoint.add': () => fetchCpuBreakpoints(),
			'cpu.breakpoint.update': () => fetchCpuBreakpoints(),
			'cpu.breakpoint.remove': () => fetchCpuBreakpoints(),
			'memory.breakpoint.add': () => fetchMemoryBreakpoints(),
			'memory.breakpoint.update': () => fetchMemoryBreakpoints(),
			'memory.breakpoint.remove': () => fetchMemoryBreakpoints(),
		});
		return () => listeners.forget(listeners_);
	}, [fetchBreakpoints, fetchCpuBreakpoints, fetchMemoryBreakpoints, clearBreakpoints]);

	const handleToggleCpuBreakpoint = (breakpoint) => {
		context.ppsspp.send({
			event: 'cpu.breakpoint.update',
			address: breakpoint.address,
			enabled: !breakpoint.enabled,
		});
	};

	const handleToggleMemoryBreakpoint = (breakpoint) => {
		context.ppsspp.send({
			event: 'memory.breakpoint.update',
			address: breakpoint.address,
			size: breakpoint.size,
			enabled: !breakpoint.enabled,
		});
	};

	const handleToggleBreakpoint = (breakpoint, type) => {
		if (type === 'memory') {
			handleToggleMemoryBreakpoint(breakpoint);
		} else if (type === 'execute') {
			handleToggleCpuBreakpoint(breakpoint);
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
		if (ev.key === ' ' && selectedBreakpoint) {
			handleToggleBreakpoint(selectedBreakpoint, selectedBreakpoint.size ? 'memory' : 'execute');
			ev.preventDefault();
		}
		if (ev.key === 'Enter' && selectedBreakpoint) {
			setEditingBreakpoint(selectedBreakpoint);
			ev.preventDefault();
		}
		if (ev.key === 'Delete' && selectedBreakpoint) {
			if (selectedBreakpoint.size) {
				context.ppsspp.send({
					event: 'memory.breakpoint.remove',
					address: selectedBreakpoint.address,
					size: selectedBreakpoint.size,
				});
			} else {
				context.ppsspp.send({
					event: 'cpu.breakpoint.remove',
					address: selectedBreakpoint.address,
				});
			}
			ev.preventDefault();
		}
	};

	return (
		<>
			<ContextMenuTrigger id="breakpointPanel" holdToDisplay={-1} attributes={{ id: 'BreakpointPanel' }}>
				<table className="BreakpointPanel__table" onKeyDown={onKeyDown} tabIndex={0}>
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
						<col style={{ width: '1%' }}/>
						<col style={{ width: '18%' }}/>
						<col style={{ width: '18%' }}/>
						<col style={{ width: '18%' }}/>
						<col style={{ width: '18%' }}/>
						<col style={{ width: '18%' }}/>
						<col style={{ width: '9%' }}/>
					</colgroup>
					<tbody>
						{breakpoints.map((breakpoint, index) =>
							<BreakpointPanelItem
								key={`${breakpoint.address}-${breakpoint.size || 0}`}
								breakpoint={breakpoint}
								type={breakpoint.size ? 'memory' : 'execute'}
								selected={index === selectedRow}
								gotoDisasm={props.gotoDisasm}
								toggleBreakpoint={handleToggleBreakpoint}
								onSelect={() => setSelectedRow(index)}/>,
						)}
					</tbody>
				</table>
				{breakpoints.length === 0 ?
					<div className="BreakpointPanel__no-breakpoints">No breakpoints set</div>
					: null
				}
			</ContextMenuTrigger>
			<BreakpointModal
				isOpen={!!(editingBreakpoint || creatingBreakpoint)}
				onClose={handleCloseBreakpointModal}
				breakpoint={editingBreakpoint}
			/>
			<BreakpointContextMenu
				toggleBreakpoint={handleToggleBreakpoint}
				editBreakpoint={(breakpoint, type) => setEditingBreakpoint({ ...breakpoint, type })}
				createBreakpoint={() => setCreatingBreakpoint(true)}/>
		</>
	);
}

BreakpointPanel.propTypes = {
	gotoDisasm: PropTypes.func.isRequired,
};
