import React, { Component } from 'react';
import { ContextMenu, MenuItem } from 'react-contextmenu';
import DisasmBranchGuide from './DisasmBranchGuide';
import DisasmLine from './DisasmLine';
import listeners from '../../utils/listeners.js';
import { hasContextMenu } from '../../utils/dom';
import './Disasm.css';

const MIN_BUFFER = 100;
const MAX_BUFFER = 500;

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
		this.updatesSequence = Promise.resolve(null);
		this.updatesPending = 0;

		this.listRef = React.createRef();
		this.cursorRef = React.createRef();

		this.needsScroll = false;
		this.needsOffsetFix = false;

		listeners.listen({
			'connection': () => this.updateDisasm(null),
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
		};

		return [
			<div key="disasm" className="Disasm" onScroll={ev => this.onScroll(ev)}>
				<div className="Disasm__list" ref={this.listRef} {...events}>
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

	getSnapshotBeforeUpdate(prevProps, prevState) {
		if (this.needsOffsetFix && this.cursorRef.current) {
			const top = this.cursorRef.current.boundingTop();
			if (top) {
				return { top };
			}
		}
		return null;
	}

	componentDidUpdate(prevProps, prevState, snapshot) {
		const { selectionTop, selectionBottom } = this.props;
		const { range, lineHeight, cursor } = this.state;

		let disasmChange = false;
		if (this.state.displaySymbols !== prevState.displaySymbols) {
			// Keep the existing range, just update.
			disasmChange = this.state.range;
		}
		if (selectionTop !== prevProps.selectionTop || selectionBottom !== prevProps.selectionBottom) {
			if (selectionTop < range.start || selectionBottom >= range.end) {
				disasmChange = null;
			}
			if (cursor < selectionTop || cursor > selectionBottom) {
				this.setState({ cursor: selectionTop });
			}
		}
		if (disasmChange !== false) {
			this.updateDisasm(disasmChange);
		}

		if (lineHeight === 0) {
			const foundLine = document.querySelector('.DisasmLine');
			if (foundLine) {
				this.setState({ lineHeight: foundLine.clientHeight });
			}
		}

		// Always associated with a state update.
		if (this.needsScroll && this.cursorRef.current) {
			this.cursorRef.current.ensureInView(this.needsScroll);
			this.needsScroll = false;
		}

		if (snapshot && this.cursorRef.current) {
			const top = this.cursorRef.current.boundingTop();
			this.listRef.current.parentNode.scrollTop -= snapshot.top - top;
			this.needsOffsetFix = false;
		}
	}

	updateDisasm(newRange) {
		const updateRange = {
			address: newRange === null ? this.props.selectionTop - MIN_BUFFER * 4: newRange.start,
			count: newRange === null ? MIN_BUFFER * 2 : undefined,
			end: newRange !== null ? newRange.end : undefined,
		};

		this.updatesPending++;
		this.updatesSequence = this.updatesSequence.then(res => {
			return this.props.ppsspp.send({
				event: 'memory.disasm',
				...updateRange,
				displaySymbols: this.state.displaySymbols,
			}).then((data) => {
				const { range, branchGuides, lines } = data;
				if (newRange === null) {
					this.needsScroll = 'center';
				} else {
					this.needsOffsetFix = true;
				}
				this.setState({ range, branchGuides, lines });
			}, (err) => {
				this.setState({ range: { start: 0, end: 0 }, branchGuides: [], lines: [] });
			}).finally(() => {
				this.updatesPending--;
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
		// Don't change selection if right clicking within the selection.
		if (ev.button !== 2 || line.address < this.props.selectionTop || line.address > this.props.selectionBottom) {
			this.applySelection(ev, line);
		} else if (this.state.cursor !== line.address) {
			// But do change the cursor.
			this.setState({ cursor: line.address });
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
		// For focus.
		this.needsScroll = 'nearest';
		this.setState({ mouseDown: false });
	}

	onMouseMove(ev) {
		if (ev.buttons === 0) {
			this.needsScroll = 'nearest';
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

			if (ev.key === 'ArrowUp' && lineIndex > 0) {
				this.needsScroll = 'nearest';
				this.applySelection(ev, this.state.lines[lineIndex - 1]);
				ev.preventDefault();
			}
			if (ev.key === 'ArrowDown' && lineIndex < this.state.lines.length - 1) {
				this.needsScroll = 'nearest';
				this.applySelection(ev, this.state.lines[lineIndex + 1]);
				ev.preventDefault();
			}
		}

		if (ev.key === 'Tab') {
			this.setState({ displaySymbols: !this.state.displaySymbols });
			ev.preventDefault();
		}
	}

	onScroll(ev) {
		const { scrollHeight, scrollTop, clientHeight } = ev.target;
		const bufferTop = scrollTop / this.state.lineHeight;
		const bufferBottom = (scrollHeight - scrollTop - clientHeight) / this.state.lineHeight;

		let { start, end } = this.state.range;

		if (bufferTop < MIN_BUFFER) {
			start -= MIN_BUFFER * 4;
		} else if (bufferTop > MAX_BUFFER) {
			start += MIN_BUFFER * 4;
		}

		if (bufferBottom < MIN_BUFFER) {
			end += MIN_BUFFER * 4;
		} else if (bufferBottom > MAX_BUFFER) {
			end -= MIN_BUFFER * 4;
		}

		if (start !== this.state.range.start || end !== this.state.range.end) {
			if (this.updatesPending === 0) {
				this.updateDisasm({ start, end });
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

		let { start, end } = this.state.range;

		// This is here for keyboard scrolling.
		if (selectionTop - MIN_BUFFER * 4 < start) {
			start = selectionTop - MIN_BUFFER * 2 * 4;
		} else if (selectionTop - MAX_BUFFER * 4 > start) {
			start = selectionTop - (MAX_BUFFER - MIN_BUFFER) * 4;
		}
		if (selectionBottom + MIN_BUFFER * 4 > end) {
			end = selectionBottom + MIN_BUFFER * 2 * 4;
		} else if (selectionBottom + MAX_BUFFER * 4 < end) {
			end = selectionBottom + (MAX_BUFFER - MIN_BUFFER) * 4;
		}

		if (start !== this.state.range.start || end !== this.state.range.end) {
			if (this.updatesPending === 0) {
				this.updateDisasm({ start, end });
			}
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
