import { connectMenu, ContextMenu, MenuItem } from 'react-contextmenu';
import PropTypes from 'prop-types';

function BreakpointPanelContextMenu(props) {
	const { id, trigger, hasBreakpoints, hasEnabledBreakpoints } = props;

	return (
		<ContextMenu id={id}>
			{trigger?.breakpoint ? (<>
				<MenuItem onClick={() => props.toggleBreakpoint(trigger.breakpoint)}>
					Toggle Break
				</MenuItem>
				<MenuItem onClick={() => props.editBreakpoint(trigger.breakpoint)}>
					Edit&hellip;
				</MenuItem>
				<MenuItem onClick={() => props.removeBreakpoint(trigger.breakpoint)}>
					Remove
				</MenuItem>
				<MenuItem divider />
			</>) : null}
			<MenuItem onClick={() => props.createBreakpoint()}>
				Add New&hellip;
			</MenuItem>
			<MenuItem onClick={() => props.clearBreakpoints()} disabled={!hasBreakpoints}>
				Remove All&hellip;
			</MenuItem>
			<MenuItem onClick={() => props.disableBreakpoints()} disabled={!hasEnabledBreakpoints}>
				Disable All
			</MenuItem>
		</ContextMenu>
	);
}

BreakpointPanelContextMenu.propTypes = {
	id: PropTypes.string.isRequired,
	trigger: PropTypes.shape({
		breakpoint: PropTypes.object,
	}),

	toggleBreakpoint: PropTypes.func.isRequired,
	editBreakpoint: PropTypes.func.isRequired,
	removeBreakpoint: PropTypes.func.isRequired,
	createBreakpoint: PropTypes.func.isRequired,
	clearBreakpoints: PropTypes.func.isRequired,
	disableBreakpoints: PropTypes.func.isRequired,
	hasBreakpoints: PropTypes.bool.isRequired,
	hasEnabledBreakpoints: PropTypes.bool.isRequired,
};

export default connectMenu('breakpointPanel')(BreakpointPanelContextMenu);
