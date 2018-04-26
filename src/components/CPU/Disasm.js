import React, { Component } from 'react';
import { ContextMenu, MenuItem } from 'react-contextmenu';
import DisasmBranchGuide from './DisasmBranchGuide';
import DisasmLine from './DisasmLine';
import listeners from '../../utils/listeners.js';
import { hasContextMenu } from '../../utils/dom';
import './Disasm.css';

class Disasm extends Component {
	constructor(props) {
		super(props);

		this.state = {
			lines: [],
			branchGuides: [],
			range: { start: 0, end: 0 },
			lineHeight: 0,
			displaySymbols: true,
			mouseDown: false,
			cursor: null,
		};
		this.updateSequence = Promise.resolve(null);
		this.listRef = React.createRef();
		this.cursorRef = React.createRef();
		this.needsScroll = false;

		listeners.listen({
			// TODO: Manage window start.
			'connection': () => this.updateDisasm(this.props.selectionTop - 15 * 4),
		});
	}

	render() {
		const offsets = this.calcOffsets();
		const events = {
			onDragStart: ev => ev.preventDefault(),
			onMouseDownCapture: ev => this.onMouseDown(ev),
			onMouseUpCapture: this.state.mouseDown ? (ev => this.onMouseUp(ev)) : undefined,
			onMouseMove: this.state.mouseDown ? (ev => this.onMouseMove(ev)) : undefined,
			onKeyDown: ev => this.onKeyDown(ev),
			// TODO: Scroll events.
		};

		return [
			<div key="disasm" className="Disasm" {...events}>
				<div className="Disasm__list" ref={this.listRef}>
					{this.state.lines.map((line) => this.renderLine(line))}
					{this.state.branchGuides.map((guide) => this.renderBranchGuide(guide, offsets))}
				</div>
			</div>,
			this.renderContextMenu(),
		];
	}

	renderLine(line) {
		const { displaySymbols } = this.state;
		const props = {
			displaySymbols,
			line,
			selected: line.address >= this.props.selectionTop && line.address <= this.props.selectionBottom,
			cursor: line.address === this.state.cursor,
			onDoubleClick: this.onDoubleClick,
			ref: line.address === this.state.cursor ? this.cursorRef : undefined,
		};

		return <DisasmLine key={line.address} contextmenu="disasm" {...props} />;
	}

	renderBranchGuide(guide, offsets) {
		const key = String(guide.top) + String(guide.bottom) + guide.direction;
		const { range, lineHeight } = this.state;
		const selected = guide.top === this.state.cursor || guide.bottom === this.state.cursor;

		return <DisasmBranchGuide {...{ key, guide, range, offsets, lineHeight, selected }} />;
	}

	renderContextMenu() {
		const disabled = !this.props.stepping;
		return (
			<ContextMenu key="menu" id="disasm">
				<MenuItem data={{ action: 'copy_address' }} onClick={this.handleTodo}>
					Copy Address
				</MenuItem>
				<MenuItem data={{ action: 'copy_hex' }} onClick={this.handleTodo}>
					Copy Instruction (Hex)
				</MenuItem>
				<MenuItem data={{ action: 'copy_disasm' }} onClick={this.handleTodo}>
					Copy Instruction (Disasm)
				</MenuItem>
				<MenuItem divider />
				<MenuItem data={{ action: 'assemble' }} disabled={disabled} onClick={this.handleTodo}>
					Assemble Opcode...
				</MenuItem>
				<MenuItem divider />
				<MenuItem data={{ action: 'step_until' }} disabled={disabled} onClick={this.handleTodo}>
					Run to Cursor
				</MenuItem>
				<MenuItem data={{ action: 'change_pc' }} disabled={disabled} onClick={this.handleTodo}>
					Jump to Cursor
				</MenuItem>
				<MenuItem data={{ action: 'toggle_breakpoint' }} onClick={this.handleTodo}>
					Toggle Breakpoint
				</MenuItem>
				<MenuItem divider />
				<MenuItem data={{ action: 'follow_branch' }} onClick={this.handleTodo}>
					Follow Branch
				</MenuItem>
				<MenuItem data={{ action: 'goto_memory' }} onClick={this.handleTodo}>
					Go to in Memory View
				</MenuItem>
				<MenuItem data={{ action: 'goto_jit' }} onClick={this.handleTodo}>
					Go to in Jit Compare
				</MenuItem>
				<MenuItem divider />
				<MenuItem data={{ action: 'func_rename' }} onClick={this.handleTodo}>
					Rename Function...
				</MenuItem>
				<MenuItem data={{ action: 'func_remove' }} onClick={this.handleTodo}>
					Remove Function
				</MenuItem>
				<MenuItem data={{ action: 'func_add' }} onClick={this.handleTodo}>
					Add Function Here
				</MenuItem>
			</ContextMenu>
		);
	}

	calcOffsets() {
		// TODO: This is sorta ugly, but...
		let pos = 0;
		let offsets = {};
		this.state.lines.forEach((line) => {
			offsets[line.address] = pos;
			pos += this.state.lineHeight;
		});
		return offsets;
	}

	componentDidUpdate(prevProps, prevState) {
		const { selectionTop, selectionBottom } = this.props;
		const { range, lineHeight, cursor } = this.state;

		if (selectionTop !== prevProps.selectionTop || selectionBottom !== prevProps.selectionBottom) {
			if (range === null || selectionTop < range.start || selectionBottom >= range.end) {
				this.updateDisasm(selectionTop - 15 * 4);
			}
			if (cursor < selectionTop || cursor > selectionBottom) {
				this.setState({ cursor: selectionTop });
			}
		}

		if (lineHeight === 0) {
			const foundLine = document.querySelector('.DisasmLine');
			if (foundLine) {
				this.setState({ lineHeight: foundLine.clientHeight });
			}
		}

		// Always associated with a state update.
		if (this.needsScroll && this.cursorRef.current) {
			this.cursorRef.current.ensureInView();
			this.needsScroll = false;
		}
	}

	updateDisasm(addr) {
		this.updateSequence = this.updateSequence.then(res => {
			return this.props.ppsspp.send({
				event: 'memory.disasm',
				address: addr,
				// TODO: Calculate properly.
				count: 96,
				displaySymbols: this.state.displaySymbols,
			}).then((data) => {
				const { range, branchGuides, lines } = data;
				this.setState({ range, branchGuides, lines });
			}, (err) => {
				this.setState({ range: { start: 0, end: 0 }, branchGuides: [], lines: [] });
			});
		});
	}

	handleTodo = (ev, data) => {
		// TODO
		console.log(data);
	}

	onDoubleClick = (ev, data) => {
		console.log('breakpoint', data);
	}

	onMouseDown(ev) {
		const line = this.mouseEventToLine(ev);
		this.applySelection(ev, line);
		if (ev.button === 0) {
			this.setState({ mouseDown: true });
		}
	}

	onMouseUp(ev) {
		const line = this.mouseEventToLine(ev);
		if (line) {
			this.applySelection(ev, line);
		}
		// For focus.
		this.needsScroll = true;
		this.setState({ mouseDown: false });
	}

	onMouseMove(ev) {
		if (ev.buttons === 0) {
			this.needsScroll = true;
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
		if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown') {
			const lineIndex = this.findCursorLineIndex();

			// TODO: Handle scroll outside viewport.
			if (ev.key === 'ArrowUp' && lineIndex > 0) {
				this.needsScroll = true;
				this.applySelection(ev, this.state.lines[lineIndex - 1]);
				ev.preventDefault();
			}
			if (ev.key === 'ArrowDown' && lineIndex < this.state.lines.length - 1) {
				this.needsScroll = true;
				this.applySelection(ev, this.state.lines[lineIndex + 1]);
				ev.preventDefault();
			}
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
		if (this.state.cursor !== line.address) {
			this.setState({ cursor: line.address });
		}
	}

	mouseEventToLine(ev) {
		// Account for page and list scrolling.
		const y = ev.pageY - this.listRef.current.getBoundingClientRect().top - window.scrollY;
		const index = Math.floor(y / this.state.lineHeight);
		return this.state.lines[index];
	}

	findCursorLineIndex() {
		const addr = this.state.cursor ? this.state.cursor : this.props.selectionTop;
		for (let i = 0; i < this.state.lines.length; ++i) {
			if (this.state.lines[i].address === addr) {
				return i;
			}
		}

		return undefined;
	}
}

Disasm.defaultProps = {
	ppsspp: null,
	log: null,
	selectionTop: null,
	selectionBottom: null,
	stepping: false,
	updateSelection: null,
};

export default Disasm;
