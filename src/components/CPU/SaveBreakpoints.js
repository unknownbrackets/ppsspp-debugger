import FitModal from '../common/FitModal';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { setAutoPersistBreakpoints, isAutoPersistingBreakpoints } from '../../utils/persist';

export default function SaveBreakpoints(props) {
	const [persisting, setPersisting] = useState(isAutoPersistingBreakpoints());
	const updatePersisting = (ev) => {
		setAutoPersistBreakpoints(ev.target.checked);
		setPersisting(ev.target.checked);
	};

	return (
		<FitModal contentLabel="Breakpoints" isOpen={props.isOpen} onClose={props.onClose}>
			<h2>Breakpoints</h2>

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
