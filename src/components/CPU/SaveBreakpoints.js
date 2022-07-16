import FitModal from '../common/FitModal';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { useDebuggerContext } from '../DebuggerContext';
import { setAutoPersistBreakpoints, isAutoPersistingBreakpoints, cleanBreakpointForPersist } from '../../utils/persist';
import './SaveBreakpoints.css';

function downloadBreakpoints(context) {
	let promises = [
		context.ppsspp.send({ event: 'game.status' }).then(({ game }) => game.id).catch(() => null),
		context.ppsspp.send({ event: 'cpu.breakpoint.list' }).then(({ breakpoints }) => breakpoints, () => []),
		context.ppsspp.send({ event: 'memory.breakpoint.list' }).then(({ breakpoints }) => breakpoints, () => []),
	];
	Promise.all(promises).then(([id, cpu, memory]) => {
		const data = {
			version: '1.0',
			id,
			cpu: cpu.map(cleanBreakpointForPersist),
			memory: memory.map(cleanBreakpointForPersist),
		};

		let a = document.createElement('a');
		a.setAttribute('download', id + '.breakpoints.json');
		a.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data));
		a.hidden = true;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	});
}

function restoreBreakpoints(context, data) {
	let completion = [];
	for (let bp of data.cpu) {
		completion.push(context.ppsspp.send({
			event: 'cpu.breakpoint.add',
			...bp,
		}).then(() => true, (err) => {
			console.error('Unable to import breakpoint', err);
			return false;
		}));
	}
	for (let bp of data.memory) {
		completion.push(context.ppsspp.send({
			event: 'memory.breakpoint.add',
			...bp,
		}).then(() => true, (err) => {
			console.error('Unable to import breakpoint', err);
			return false;
		}));
	}

	Promise.all(completion).then((results) => {
		const succeeded = results.filter(v => v === true).length;
		const failed = results.filter(v => v === false).length;

		if (failed === 0 && succeeded === 0) {
			window.alert('No breakpoints were found to import.');
		} else if (failed === 0) {
			window.alert('Breakpoints imported successfully.');
		} else if (succeeded === 0) {
			window.alert('Failed to import breakpoints (see log.)');
		} else {
			window.alert('Some breakpoints failed to import (see log.)');
		}
	});
}

function promptRestoreBreakpoints(context) {
	// Could have canceled before, cleanup old inputs.
	if (document.getElementById('save-breakpoints-file')) {
		document.body.removeChild(document.getElementById('save-breakpoints-file'));
	}

	let input = document.createElement('input');
	input.id = 'save-breakpoints-file';
	input.setAttribute('type', 'file');
	input.setAttribute('accept', 'application/json');
	input.style.position = 'absolute';
	input.style.top = '0';
	input.style.left = '0';
	input.style.width = '1px';
	input.style.height = '1px';
	input.style.visibility = 'hidden';

	document.body.appendChild(input);
	input.addEventListener('change', (event) => {
		const fileList = event.target.files;
		const reader = new FileReader();
		reader.addEventListener('load', (event) => {
			const data = JSON.parse(reader.result);
			if (Array.isArray(data.cpu) && Array.isArray(data.memory) && data.version) {
				restoreBreakpoints(context, data);
			} else {
				window.alert('Format unrecogized, unable to import breakpoints.');
			}
			document.body.removeChild(input);
		});
		reader.readAsText(fileList[0]);
	});
	input.click();
}

export default function SaveBreakpoints(props) {
	const context = useDebuggerContext();
	const [persisting, setPersisting] = useState(isAutoPersistingBreakpoints());
	const updatePersisting = (ev) => {
		setAutoPersistBreakpoints(ev.target.checked);
		setPersisting(ev.target.checked);
	};

	return (
		<FitModal contentLabel="Breakpoints" isOpen={props.isOpen} onClose={props.onClose}>
			<h2>Breakpoints</h2>

			<div className="SaveBreakpoints__file-buttons">
				<button type="button" onClick={ev => downloadBreakpoints(context)}>Export to file</button>
				<button type="button" onClick={ev => promptRestoreBreakpoints(context)}>Import from file</button>
			</div>

			<label>
				<input type="checkbox" checked={persisting} onChange={updatePersisting} />
				Save and restore on this device automatically
			</label>
		</FitModal>
	);
}

SaveBreakpoints.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
};
