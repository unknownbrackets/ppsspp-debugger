import React, { Component } from 'react';
import { toString08X } from '../../utils/format';
import classNames from 'classnames';

class DisasmLine extends Component {
	render() {
		const { line } = this.props;

		const className = classNames({
			'DisasmLine': true,
			'DisasmLine--breakpoint': line.breakpoint && line.breakpoint.enabled,
			'DisasmLine--disabled-breakpoint': line.breakpoint && !line.breakpoint.enabled,
			'DisasmLine--current': line.isCurrentPC,
		});

		return (
			<div className={className} style={{ backgroundColor: line.backgroundColor }}>
				{this.renderAddress(line)}
				<code className="DisasmLine__opcode">{line.name} </code>
				<code className="DisasmLine__params">{line.params}{this.renderConditional(line)}</code>
			</div>
		);
	}

	renderAddress(line) {
		const { symbol, address, encoding } = line;
		const addressHex = toString08X(address);

		if (this.props.displaySymbols) {
			if (symbol !== null)
				return <code className="DisasmLine__address DisasmLine__address--symbol">{symbol}:</code>;
			return <code className="DisasmLine__address DisasmLine__address--nosymbol">{addressHex}</code>;
		}
		return (
			<code className="DisasmLine__address DisasmLine__address--hexonly">
				{addressHex} {toString08X(encoding)}
			</code>
		);
	}

	renderConditional(line) {
		if (line.isCurrentPC && line.conditionMet !== null) {
			return line.conditionMet ? ' ; true' : ' ; false';
		}
		return '';
	}
}

DisasmLine.defaultProps = {
	line: null,
	displaySymbols: true,
};

export default DisasmLine;
