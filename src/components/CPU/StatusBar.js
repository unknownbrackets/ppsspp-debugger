import { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { toString02X, toString04X, toString08X } from '../../utils/format';
import './StatusBar.css';

class StatusBar extends PureComponent {
	render() {
		const { line } = this.props;
		if (!line) {
			return <div className="StatusBar"></div>;
		}

		return (
			<div className="StatusBar">
				<div className="StatusBar__left">{this.renderLeftStatus(line)}</div>
				<div className="StatusBar__right">{line.function || line.symbol || ''}</div>
			</div>
		);
	}

	renderLeftStatus(line) {
		if (line.type === 'opcode' || line.type === 'macro') {
			if (line.dataAccess) {
				return this.renderDataAccess(line.dataAccess);
			} else if (line.branch) {
				return this.renderBranch(line.branch);
			} else if (line.relevantData && typeof line.relevantData.stringValue === 'string') {
				return this.renderString(line.relevantData);
			}
		} else if (line.type === 'data') {
			return this.renderDataSymbol(line.dataSymbol, line.address);
		}

		return '';
	}

	renderDataAccess(dataAccess) {
		if (dataAccess.uintValue === null) {
			return 'Invalid address ' + toString08X(dataAccess.address);
		}

		let status = '[' + toString08X(dataAccess.address) + '] = ';
		if (dataAccess.valueSymbol) {
			status += dataAccess.valueSymbol + ' (';
		}
		if (dataAccess.size === 1) {
			status += toString02X(dataAccess.uintValue);
		} else if (dataAccess.size === 2) {
			status += toString04X(dataAccess.uintValue);
		} else if (dataAccess.size >= 4) {
			// TODO: Show vectors better.
			status += toString08X(dataAccess.uintValue);
		}
		if (dataAccess.valueSymbol) {
			status += ')';
		}

		return status;
	}

	renderBranch(branch) {
		let status = branch.targetAddress ? toString08X(branch.targetAddress) : '';
		if (branch.symbol) {
			status += ' = ' + branch.symbol;
		}
		return status;
	}

	renderString(data) {
		return '[' + toString08X(data.address) + '] = ' + JSON.stringify(data.stringValue);
	}

	renderDataSymbol(dataSymbol, address) {
		let status = toString08X(dataSymbol.start);
		if (dataSymbol.label) {
			status += ' (' + dataSymbol.label + ')';
		}
		if (address !== dataSymbol.start) {
			status += ' + ' + toString08X(dataSymbol.start - address);
		}
		return status;
	}
}

StatusBar.propTypes = {
	line: PropTypes.object,
};

export default StatusBar;
