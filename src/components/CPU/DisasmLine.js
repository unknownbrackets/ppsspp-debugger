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
					<code className="DisasmLine__opcode">{this.highlight(line.name, '', line.params)} </code>
					<code className="DisasmLine__params">{this.highlightParams(line.params, line.name, '')}{this.renderConditional(line)}</code>
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

	highlight(text, before = '', after = '') {
		const { highlight } = this.props;
		if (highlight !== null) {
			const fullText = (before ? before + ' ' : '') + text + ' ' + after;
			let pos = fullText.toLowerCase().indexOf(highlight);
			let matchLength = highlight.length;
			if (pos !== -1) {
				const beforeLength = before ? before.length + 1 : 0;
				if (pos < beforeLength) {
					matchLength -= beforeLength - pos;
					pos = matchLength > 0 ? 0 : -1;
				} else {
					pos -= beforeLength;
				}
			}

			if (pos >= 0 && pos < text.length) {
				const className = classNames({
					'DisasmLine__highlight': true,
					'DisasmLine__highlight--end': pos + matchLength > text.length + 1,
				});
				return (
					<React.Fragment>
						{text.substr(0, pos)}
						<span className={className}>{text.substr(pos, matchLength)}</span>
						{text.substr(pos + matchLength)}
					</React.Fragment>
				);
			}
		}
		return text;
	}

	highlightParams(text, before = '', after = '') {
		const { highlight, highlightParams } = this.props;
		if (highlight === null) {
			const params = text.split(/([,()])/);
			const toHighlight = highlightParams || [];
			return params.map((param, key) => {
				let className = 'DisasmLine__param';
				if (toHighlight.includes(param)) {
					className += ' DisasmLine__param--highlighted';
				}
				return <span className={className} key={key}>{param}</span>;
			});
		}
		return this.highlight(text, before, after);
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
