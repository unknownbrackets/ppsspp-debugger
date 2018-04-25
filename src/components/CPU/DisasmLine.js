import React, { Component } from 'react';
import { ContextMenuTrigger } from 'react-contextmenu';
import { toString08X } from '../../utils/format';
import classNames from 'classnames';
import BreakpointIcon from './BreakpointIcon';

class DisasmLine extends Component {
	render() {
		const { line, selected, cursor } = this.props;

		const className = classNames({
			'DisasmLine': true,
			'DisasmLine--selected': selected,
			'DisasmLine--cursor': cursor,
			'DisasmLine--breakpoint': line.breakpoint && line.breakpoint.enabled,
			'DisasmLine--disabled-breakpoint': line.breakpoint && !line.breakpoint.enabled,
			'DisasmLine--current': line.isCurrentPC,
		});

		const mapData = (props) => {
			return { line };
		};
		const attributes = {
			onDoubleClick: (ev) => this.onDoubleClick(ev, mapData()),
		};

		return (
			<ContextMenuTrigger id={this.props.contextmenu} renderTag="a" collect={mapData} attributes={attributes}>
				<div className={className} style={{ backgroundColor: line.backgroundColor }}>
					<BreakpointIcon className="DisasmLine__breakpoint-icon" />
					{this.renderAddress(line)}
					<code className="DisasmLine__opcode">{line.name} </code>
					<code className="DisasmLine__params">{line.params}{this.renderConditional(line)}</code>
				</div>
			</ContextMenuTrigger>
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

	onDoubleClick(ev, data) {
		if (ev.button === 0) {
			this.props.onDoubleClick(ev, data);
		}
	}
}

DisasmLine.defaultProps = {
	line: null,
	selected: false,
	cursor: false,
	displaySymbols: true,
	contextmenu: null,
	onDoubleClick: null,
};

export default DisasmLine;
