import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

class FuncList extends PureComponent {
	render() {
		return (
			<div>
				<input type="search" />
				<ol>
					<li>TODO</li>
				</ol>
			</div>
		);
	}
}

FuncList.propTypes = {
	ppsspp: PropTypes.object.isRequired,
	log: PropTypes.func.isRequired,
	gotoDisasm: PropTypes.func.isRequired,
};

export default FuncList;
