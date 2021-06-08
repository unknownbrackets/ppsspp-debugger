import PropTypes from 'prop-types';

export default function BreakpointIcon(props) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" className={props.className} viewBox="0 0 1536 1536" width="12" height="12">
			<path d="M768,0 q209,0 385.5,103 t279.5,279.5 t103,385.5 t-103,385.5 t-279.5,279.5 t-385.5,103 t-385.5,-103 t-279.5,-279.5 t-103,-385.5 t103,-385.5 t279.5,-279.5 t385.5,-103 zm128,1247 v-190 q0,-14 -9,-23.5 t-22,-9.5 h-192 q-13,0 -23,10 t-10,23 v190 q0,13 10,23 t23,10 h192 q13,0 22,-9.5 t9,-23.5 zm-2,-344 l18,-621 q0,-12 -10,-18 q-10,-8 -24,-8 h-220 q-14,0 -24,8 q-10,6 -10,18 l17,621 q0,10 10,17.5 t24,7.5 h185 q14,0 23.5,-7.5 t10.5,-17.5 z" />
		</svg>
	);
}

BreakpointIcon.propTypes = {
	className: PropTypes.string.isRequired,
};
