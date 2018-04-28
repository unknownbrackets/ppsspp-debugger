import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ContextMenuTrigger } from 'react-contextmenu';
import { toString08X } from '../../utils/format';
import { ensureInView } from '../../utils/dom';
import classNames from 'classnames';
import BreakpointIcon from './BreakpointIcon';

class DisasmLine extends PureComponent {
	ref;

	constructor(props) {
		super(props);

		this.ref = React.createRef();
	}

	render() {
		const { line, selected, focused, cursor } = this.props;

		const className = classNames({
			'DisasmLine': true,
			'DisasmLine--selected': selected && !focused,
			'DisasmLine--focused': focused,
			'DisasmLine--cursor': cursor,
			'DisasmLine--breakpoint': line.breakpoint && line.breakpoint.enabled,
			'DisasmLine--disabled-breakpoint': line.breakpoint && !line.breakpoint.enabled,
			'DisasmLine--current': line.isCurrentPC,
		});

		const mapData = (props) => {
			return { line, node: this.ref.current.parentNode };
		};
		const attributes = {
			onDoubleClick: (ev) => this.onDoubleClick(ev, mapData()),
			tabIndex: 0,
		};

		return (
			<ContextMenuTrigger id={this.props.contextmenu} renderTag="a" collect={mapData} attributes={attributes}>
				<div className={className} style={{ backgroundColor: line.backgroundColor }} ref={this.ref} data-address={line.address}>
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

	ensureInView(needsScroll) {
		const triggerNode = this.ref.current.parentNode;
		ensureInView(triggerNode, { block: needsScroll });
		triggerNode.focus();
	}

	static addressBoundingTop(parentNode, address) {
		const lineNode = parentNode.querySelector('.DisasmLine[data-address="' + address + '"]');
		if (lineNode) {
			const triggerNode = lineNode.parentNode;
			return triggerNode.getBoundingClientRect().top;
		}
		return null;
	}
}

DisasmLine.propTypes = {
	line: PropTypes.shape({
		address: PropTypes.number.isRequired,
	}).isRequired,
	selected: PropTypes.bool,
	focused: PropTypes.bool,
	cursor: PropTypes.bool,
	displaySymbols: PropTypes.bool,
	contextmenu: PropTypes.string.isRequired,
	onDoubleClick: PropTypes.func.isRequired,
};

export default DisasmLine;
