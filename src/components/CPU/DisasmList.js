import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import DisasmBranchGuide from './DisasmBranchGuide';
import DisasmLine from './DisasmLine';
import { hasContextMenu } from '../../utils/dom';
import { listenCopy, forgetCopy } from '../../utils/clipboard';

class DisasmList extends PureComponent {
	state = {
		mouseDown: false,
		lineOffsets: {},
		lineOffsetLines: null,
	};
	ref;
	cursorRef;

	constructor(props) {
		super(props);

		this.ref = React.createRef();
		this.cursorRef = React.createRef();
	}

	render() {
		const events = {
			onMouseDownCapture: ev => this.onMouseDown(ev),
			onMouseUpCapture: this.state.mouseDown ? (ev => this.onMouseUp(ev)) : undefined,
			onMouseMove: this.state.mouseDown ? (ev => this.onMouseMove(ev)) : undefined,
			onKeyDown: ev => this.onKeyDown(ev),
		};

		return (
			<div className="Disasm__list" ref={this.ref} {...events}>
				{this.props.lines.map((line) => this.renderLine(line))}
				{this.props.branchGuides.map((guide) => this.renderBranchGuide(guide))}
			</div>
		);
	}

	renderLine(line) {
		const { selectionTop, selectionBottom, displaySymbols, cursor } = this.props;
		const props = {
			displaySymbols,
			line,
			selected: line.address >= selectionTop && line.address <= selectionBottom,
			cursor: line.address === cursor,
			onDoubleClick: this.props.onDoubleClick,
			ref: line.address === cursor ? this.cursorRef : undefined,
		};

		return <DisasmLine key={line.address} contextmenu="disasm" {...props} />;
	}

	renderBranchGuide(guide) {
		const key = String(guide.top) + String(guide.bottom) + guide.direction;
		const { range, lineHeight, cursor } = this.props;
		const props = {
			key,
			guide,
			offsets: this.state.lineOffsets,
			range,
			lineHeight,
			selected: guide.top === cursor || guide.bottom === cursor,
		};

		return <DisasmBranchGuide {...props} />;
	}

	// Exposed to parent.
	cursorBoundingTop() {
		if (this.cursorRef.current) {
			return this.cursorRef.current.boundingTop();
		}
		return null;
	}

	// Exposed to parent.
	ensureCursorInView(options) {
		if (this.cursorRef.current) {
			this.cursorRef.current.ensureInView(options);
		}
	}

	static calcOffsets(lines, lineHeight) {
		let pos = 0;
		let offsets = {};
		lines.forEach((line) => {
			offsets[line.address] = pos;
			pos += lineHeight;
		});
		return offsets;
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		if (nextProps.lines !== prevState.lineOffsetLines) {
			const lineOffsets = DisasmList.calcOffsets(nextProps.lines, nextProps.lineHeight);
			return { lineOffsets, lineOffsetLines: nextProps.lines };
		}
		return null;
	}

	componentDidMount() {
		listenCopy('.Disasm__list', this.onCopy);
	}

	componentWillUnmount() {
		forgetCopy('.Disasm__list', this.onCopy);
	}

	onCopy = (ev) => {
		return this.props.getSelectedDisasm();
	}

	onMouseDown(ev) {
		const line = this.mouseEventToLine(ev);
		// Don't change selection if right clicking within the selection.
		if (ev.button !== 2 || line.address < this.props.selectionTop || line.address > this.props.selectionBottom) {
			this.applySelection(ev, line);
		} else {
			// But do change the cursor.
			this.props.updateCursor(line.address);
		}
		if (ev.button === 0) {
			this.setState({ mouseDown: true });
		}
	}

	onMouseUp(ev) {
		const line = this.mouseEventToLine(ev);
		if (line) {
			this.applySelection(ev, line);
		}
		this.setState({ mouseDown: false });
	}

	onMouseMove(ev) {
		if (ev.buttons === 0) {
			this.setState({ mouseDown: false });
			return;
		}

		const line = this.mouseEventToLine(ev);
		if (line) {
			this.applySelection(ev, line);
		}
	}

	onKeyDown(ev) {
		if (hasContextMenu()) {
			return;
		}
		if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown' || ev.key === 'PageUp' || ev.key === 'PageDown') {
			const lineIndex = this.findCursorLineIndex();

			let dist = 1;
			if (ev.key === 'PageUp' || ev.key === 'PageDown') {
				dist = this.props.visibleLines;
			}
			if (ev.key === 'ArrowUp' || ev.key === 'PageUp') {
				dist = -dist;
			}

			const newIndex = Math.min(this.props.lines.length - 1, Math.max(0, lineIndex + dist));
			if (lineIndex !== newIndex) {
				this.applySelection(ev, this.props.lines[newIndex]);
				ev.preventDefault();
			}
		}

		if (ev.key === 'Tab') {
			this.props.updateDisplaySymbols(!this.props.displaySymbols);
			ev.preventDefault();
		}
	}

	applySelection(ev, line) {
		let { selectionTop, selectionBottom } = this.props;
		if (ev.shiftKey) {
			selectionTop = Math.min(selectionTop, line.address);
			selectionBottom = Math.max(selectionBottom, line.address);
		} else {
			selectionTop = line.address;
			selectionBottom = line.address;
		}

		if (selectionTop !== this.props.selectionTop || selectionBottom !== this.props.selectionBottom) {
			this.props.updateSelection({
				selectionTop,
				selectionBottom,
			});
		}
		this.props.updateCursor(line.address);
	}

	mouseEventToLine(ev) {
		// Account for page and list scrolling.
		const y = ev.pageY - this.ref.current.getBoundingClientRect().top - window.scrollY;
		const index = Math.floor(y / this.props.lineHeight);
		return this.props.lines[index];
	}

	findCursorLineIndex() {
		const { cursor, lines, selectionTop } = this.props;
		const addr = cursor ? cursor : selectionTop;
		for (let i = 0; i < lines.length; ++i) {
			if (lines[i].address === addr) {
				return i;
			}
		}

		return undefined;
	}
}

DisasmList.propTypes = {
	lineHeight: PropTypes.number.isRequired,
	visibleLines: PropTypes.number.isRequired,
	displaySymbols: PropTypes.bool.isRequired,
	cursor: PropTypes.number,
	selectionTop: PropTypes.number,
	selectionBottom: PropTypes.number,

	onDoubleClick: PropTypes.func.isRequired,
	updateCursor: PropTypes.func.isRequired,
	updateSelection: PropTypes.func.isRequired,
	updateDisplaySymbols: PropTypes.func.isRequired,
	getSelectedDisasm: PropTypes.func.isRequired,

	range: PropTypes.shape({
		start: PropTypes.number.isRequired,
		end: PropTypes.number.isRequired,
	}).isRequired,
	lines: PropTypes.arrayOf(PropTypes.shape({
		address: PropTypes.number.isRequired,
	})).isRequired,
	branchGuides: PropTypes.arrayOf(PropTypes.shape({
		top: PropTypes.number.isRequired,
		bottom: PropTypes.number.isRequired,
		direction: PropTypes.string.isRequired,
	})).isRequired,
};

export default DisasmList;
