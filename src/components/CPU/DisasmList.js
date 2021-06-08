import { createRef, PureComponent } from 'react';
import PropTypes from 'prop-types';
import DisasmBranchGuide from './DisasmBranchGuide';
import DisasmLine from './DisasmLine';
import { hasContextMenu } from '../../utils/dom';
import { listenCopy, forgetCopy } from '../../utils/clipboard';
import { toString08X } from '../../utils/format';
import { Timeout } from '../../utils/timeouts';

class DisasmList extends PureComponent {
	state = {
		mouseDown: false,
		focused: false,
		lineOffsets: {},
		pendingLineParams: [],
		selectedLineParams: [],
		prevLines: null,
		prevSelectionTop: null,
		prevSelectionBottom: null,
	};
	focusTimeout;
	paramsTimeout;
	ref;
	cursorRef;

	constructor(props) {
		super(props);

		this.ref = createRef();
		this.cursorRef = createRef();
		this.focusTimeout = new Timeout(() => null, 20);
		this.paramsTimeout = new Timeout(() => {
			this.setState({ selectedLineParams: this.state.pendingLineParams });
		}, 20);
	}

	render() {
		const events = {
			onMouseDownCapture: ev => this.onMouseDown(ev),
			onMouseUpCapture: this.state.mouseDown ? (ev => this.onMouseUp(ev)) : undefined,
			onMouseMove: this.state.mouseDown ? (ev => this.onMouseMove(ev)) : undefined,
			onKeyDown: ev => this.onKeyDown(ev),
			onBlur: ev => this.onFocusChange(ev, false),
			onFocus: ev => this.onFocusChange(ev, true),
		};

		return (
			<div className="Disasm__list" ref={this.ref} {...events}>
				{this.props.lines.map((line) => this.renderLine(line))}
				{this.props.branchGuides.map((guide) => this.renderBranchGuide(guide))}
			</div>
		);
	}

	renderLine(line) {
		const { displaySymbols, cursor } = this.props;
		let props = {
			displaySymbols,
			line,
			selected: this.isLineSelected(line),
			cursor: line.address === cursor,
			onDoubleClick: this.props.onDoubleClick,
			ref: line.address === cursor ? this.cursorRef : undefined,
			// Avoid re-rendering lines unnecessarily.
			highlight: this.shouldHighlight(line, this.props.highlightText) ? this.props.highlightText : null,
			highlightParams: this.shouldHighlightParams(line) ? this.state.selectedLineParams : null,
		};
		props.focused = props.selected && this.state.focused;

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

	shouldHighlight(line, match) {
		let parts = [];
		parts.push(toString08X(line.address));
		if (line.symbol !== null) {
			parts.push(line.symbol + ':');
		}
		parts.push(line.name + ' ' + line.params);

		return parts.some(part => part.toLowerCase().indexOf(match) !== -1);
	}

	shouldHighlightParams(line, match) {
		if (this.isLineSelected(line)) {
			return false;
		}
		return this.state.selectedLineParams.some(param => line.params.indexOf(param) !== -1);
	}

	// Exposed to parent.
	addressBoundingTop(address) {
		// It seems like pointless complexity to use a ref for this.
		return DisasmLine.addressBoundingTop(this.ref.current, address);
	}

	// Exposed to parent.
	ensureCursorInView(options) {
		if (this.cursorRef.current) {
			this.cursorRef.current.ensureInView(options);
		}
	}

	isLineSelected(line) {
		return DisasmList.isLineSelected(this.props, line);
	}

	static isLineSelected({ selectionTop, selectionBottom }, line) {
		return line.address + line.addressSize > selectionTop && line.address <= selectionBottom;
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

	static getSelectedLineParams({ lines, selectionTop, selectionBottom }) {
		const selectedLines = lines.filter(DisasmList.isLineSelected.bind(null, { selectionTop, selectionBottom }));

		let params = {};
		for (let line of selectedLines) {
			for (let param of line.params.split(/[,()]/)) {
				params[param] = param;
			}
		}
		delete params[''];

		return Object.values(params);
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const linesChanged = nextProps.lines !== prevState.prevLines;
		const selectionChanged = nextProps.selectionTop !== prevState.prevSelectionTop || nextProps.selectionBottom !== prevState.prevSelectionBottom;

		let offsetsUpdate = null;
		if (linesChanged) {
			const lineOffsets = DisasmList.calcOffsets(nextProps.lines, nextProps.lineHeight);
			offsetsUpdate = { lineOffsets, prevLines: nextProps.lines };
		}

		let selectedUpdate = null;
		if (linesChanged || selectionChanged) {
			selectedUpdate = {
				pendingLineParams: DisasmList.getSelectedLineParams(nextProps),
				prevSelectionTop: nextProps.selectionTop,
				prevSelectionBottom: nextProps.selectionBottom,
			};
		}

		if (offsetsUpdate !== null || selectedUpdate !== null) {
			return { ...offsetsUpdate, ...selectedUpdate };
		}
		return null;
	}

	componentDidMount() {
		listenCopy('.Disasm__list', this.onCopy);
	}

	componentWillUnmount() {
		forgetCopy('.Disasm__list', this.onCopy);
		this.paramsTimeout.cancel();
	}

	componentDidUpdate(prevProps, prevState) {
		if (this.state.pendingLineParams !== prevState.pendingLineParams) {
			// Apply the line params soon after selection change - not immediately for quicker scrolling.
			this.paramsTimeout.start();
		}
	}

	onCopy = (ev) => {
		return this.props.getSelectedDisasm();
	}

	onFocusChange(ev, focused) {
		const update = () => {
			if (focused !== this.state.focused) {
				this.setState({ focused });
			}
		};

		this.focusTimeout.cancel();

		if (!focused) {
			// We use an arbitrary short delay because a click will temporarily blur.
			this.focusTimeout.reset(update);
			this.focusTimeout.start();
		} else {
			update();
		}
	}

	onMouseDown(ev) {
		const line = this.mouseEventToLine(ev);
		// Don't change selection if right clicking within the selection.
		if (ev.button !== 2 || !this.isLineSelected(line)) {
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

		const modifiers = (ev.ctrlKey ? 'c' : '') + (ev.metaKey ? 'm' : '') + (ev.altKey ? 'a' : '') + (ev.shiftKey ? 's' : '');

		if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].includes(ev.key)) {
			let dist = 1;
			if (ev.key === 'PageUp' || ev.key === 'PageDown') {
				dist = this.props.visibleLines;
			}
			if (ev.key === 'ArrowUp' || ev.key === 'PageUp') {
				dist = -dist;
			}

			if (modifiers === '' || modifiers === 's') {
				const lineIndex = this.findCursorLineIndex();
				const newIndex = Math.min(this.props.lines.length - 1, Math.max(0, lineIndex + dist));
				if (lineIndex !== newIndex) {
					this.applySelection(ev, this.props.lines[newIndex]);
					ev.preventDefault();
				}
			} else if (ev.ctrlKey) {
				this.props.applyScroll(dist);
				ev.preventDefault();
			}
		}

		if ((ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') && modifiers === '') {
			this.props.followBranch(ev.key === 'ArrowRight', this.findCursorLine());
			ev.preventDefault();
		}

		if (ev.key === 'Tab' && modifiers === '') {
			this.props.updateDisplaySymbols(!this.props.displaySymbols);
			ev.preventDefault();
		}

		if (ev.key === 'a' && modifiers === 'c') {
			this.props.assembleInstruction(this.findCursorLine(), '');
			ev.preventDefault();
		}

		if ((ev.key === ' ' || ev.key === 'Spacebar') && modifiers === '') {
			this.props.toggleBreakpoint(this.findCursorLine());
			ev.preventDefault();
		}
		if (ev.key === 'd' && modifiers === 'c') {
			this.props.toggleBreakpoint(this.findCursorLine(), true);
			ev.preventDefault();
		}

		if ((ev.key === 's' || ev.key === 'f') && modifiers === 'c') {
			this.props.searchPrompt();
			ev.preventDefault();
		}

		if ((ev.key === 'F3') && modifiers === '') {
			this.props.searchNext();
			ev.preventDefault();
		}

		if (ev.key === 'g' && modifiers === 'c') {
			this.props.promptGoto();
			ev.preventDefault();
		}

		if (ev.key === 'e' && modifiers === 'c') {
			this.props.editBreakpoint(this.findCursorLine());
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
		const y = ev.pageY - this.ref.current.getBoundingClientRect().top - window.pageYOffset;
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

	findCursorLine() {
		const lineIndex = this.findCursorLineIndex();
		return this.props.lines[lineIndex];
	}
}

DisasmList.propTypes = {
	lineHeight: PropTypes.number.isRequired,
	visibleLines: PropTypes.number.isRequired,
	displaySymbols: PropTypes.bool.isRequired,
	cursor: PropTypes.number,
	selectionTop: PropTypes.number,
	selectionBottom: PropTypes.number,
	highlightText: PropTypes.string,

	onDoubleClick: PropTypes.func.isRequired,
	updateCursor: PropTypes.func.isRequired,
	updateSelection: PropTypes.func.isRequired,
	updateDisplaySymbols: PropTypes.func.isRequired,
	getSelectedDisasm: PropTypes.func.isRequired,
	followBranch: PropTypes.func.isRequired,
	assembleInstruction: PropTypes.func.isRequired,
	toggleBreakpoint: PropTypes.func.isRequired,
	applyScroll: PropTypes.func.isRequired,
	promptGoto: PropTypes.func.isRequired,
	searchPrompt: PropTypes.func.isRequired,
	searchNext: PropTypes.func.isRequired,
	editBreakpoint: PropTypes.func.isRequired,

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
