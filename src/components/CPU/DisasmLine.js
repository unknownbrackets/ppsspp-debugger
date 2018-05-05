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
					<code className="DisasmLine__opcode">{this.highlight(line.name)} </code>
					<code className="DisasmLine__params">{this.highlightParams(line.params)}{this.renderConditional(line)}</code>
				</div>
			</ContextMenuTrigger>
		);
	}

	renderAddress(line) {
		const { symbol, address, encoding } = line;
		const addressHex = toString08X(address);

		if (this.props.displaySymbols) {
			if (symbol !== null) {
				return <code className="DisasmLine__address DisasmLine__address--symbol">{this.highlight(symbol + ':')}</code>;
			}
			return <code className="DisasmLine__address DisasmLine__address--nosymbol">{this.highlight(addressHex)}</code>;
		}
		return (
			<code className="DisasmLine__address DisasmLine__address--hexonly">
				{this.highlight(addressHex)} {toString08X(encoding)}
			</code>
		);
	}

	renderConditional(line) {
		if (line.isCurrentPC && line.conditionMet !== null) {
			return line.conditionMet ? ' ; true' : ' ; false';
		}
		return '';
	}

	highlight(text) {
		const { highlight } = this.props;
		if (highlight !== null) {
			const pos = text.toLowerCase().indexOf(highlight);
			if (pos !== -1) {
				return (
					<React.Fragment>
						{text.substr(0, pos)}
						<span className="DisasmLine__highlight">{text.substr(pos, highlight.length)}</span>
						{text.substr(pos + highlight.length)}
					</React.Fragment>
				);
			}
		}
		return text;
	}

	highlightParams(text) {
		const { highlight, highlightParams } = this.props;
		if (highlight === null && highlightParams !== null) {
			const params = text.split(/([,()])/);
			return params.map((param, key) => {
				if (highlightParams.includes(param)) {
					return <span className="DisasmLine__highlight-param" key={key}>{param}</span>;
				}
				return param;
			});
		}
		return this.highlight(text);
	}

	onDoubleClick(ev, data) {
		if (ev.button === 0) {
			this.props.onDoubleClick(ev, data);
		}
	}

	ensureInView(needsScroll) {
		const triggerNode = this.ref.current.parentNode;
		if (needsScroll !== false) {
			ensureInView(triggerNode, { block: needsScroll });
		}
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
	highlight: PropTypes.string,
	highlightParams: PropTypes.arrayOf(PropTypes.string),
	contextmenu: PropTypes.string.isRequired,
	onDoubleClick: PropTypes.func.isRequired,
};

export default DisasmLine;
