import { connectMenu, ContextMenu, MenuItem } from 'react-contextmenu';
import PropTypes from 'prop-types';

function BreakpointPanelContextMenu(props) {
	const { id, trigger } = props;

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
};

export default connectMenu('breakpointPanel')(BreakpointPanelContextMenu);
