import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useDebuggerContext } from '../DebuggerContext';
import BreakpointPanelList from './BreakpointPanelList';
import listeners from '../../utils/listeners';

export default function BreakpointPanel(props) {
	const context = useDebuggerContext();

	const [cpuBreakpoints, setCpuBreakpoints] = useState([]);
	const [memoryBreakpoints, setMemoryBreakpoints] = useState([]);
	const [selectedRow, setSelectedRow] = useState(-1);

	const breakpoints = [...memoryBreakpoints, ...cpuBreakpoints];

	const fetchCpuBreakpoints = useCallback(() => {
		if (!context.gameStatus.started) {
			return;
		}
		context.ppsspp.send({
			event: 'cpu.breakpoint.list',
		}).then(({ breakpoints }) => {
			setCpuBreakpoints(breakpoints.map(b => ({ ...b, type: 'execute' })));
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
			setMemoryBreakpoints(breakpoints.map(b => ({ ...b, type: 'memory' })));
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

	return (
		<BreakpointPanelList breakpoints={breakpoints} selectedRow={selectedRow} setSelectedRow={setSelectedRow} gotoDisasm={props.gotoDisasm} />
	);
}

BreakpointPanel.propTypes = {
	gotoDisasm: PropTypes.func.isRequired,
};
