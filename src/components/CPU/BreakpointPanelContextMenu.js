import React from 'react';
import PropTypes from 'prop-types';
import { connectMenu, ContextMenu, MenuItem } from 'react-contextmenu';

function BreakpointPanelContextMenu(props) {
	const { id, trigger } = props;

	return (
		<ContextMenu id={id}>
			{trigger?.breakpoint ? (<>
				<MenuItem onClick={() => props.toggleBreakpoint(trigger.breakpoint, trigger.type)}>
						Toggle Break
				</MenuItem>
				<MenuItem onClick={() => props.editBreakpoint(trigger.breakpoint, trigger.type)}>
						Edit
				</MenuItem>
				<MenuItem divider/>
			</>) : null}
			<MenuItem onClick={() => props.createBreakpoint()}>
				Add New
			</MenuItem>
		</ContextMenu>
	);
}

BreakpointPanelContextMenu.propTypes = {
	id: PropTypes.string.isRequired,
	trigger: PropTypes.shape({
		breakpoint: PropTypes.object,
		type: PropTypes.oneOf(['execute', 'memory']),
	}),

	toggleBreakpoint: PropTypes.func.isRequired,
	editBreakpoint: PropTypes.func.isRequired,
	createBreakpoint: PropTypes.func.isRequired,
};

export default connectMenu('breakpointPanel')(BreakpointPanelContextMenu);
