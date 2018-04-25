import React, { Component } from 'react';
import { ContextMenu, MenuItem } from 'react-contextmenu';
import DisasmBranchGuide from './DisasmBranchGuide';
import DisasmLine from './DisasmLine';
import listeners from '../../utils/listeners.js';
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
		};
		this.updateSequence = Promise.resolve(null);

		listeners.listen({
			// TODO: Something better.
			'connection': () => this.updateDisasm(this.props.pc - 47 * 4),
		});
	}

	render() {
		const offsets = this.calcOffsets();
		const { displaySymbols } = this.state;

		return <div className="Disasm">
			{this.state.lines.map((line) => (
				<DisasmLine key={line.address} contextmenu="disasm" {...{ line, displaySymbols }} />
			))}

			{this.state.branchGuides.map((guide) => this.renderBranchGuide(guide, offsets))}
			{this.renderContextMenu()}
		</div>;
	}

	renderBranchGuide(guide, offsets) {
		const key = String(guide.top) + String(guide.bottom) + guide.direction;
		const { range, lineHeight } = this.state;
		return <DisasmBranchGuide {...{key, guide, range, offsets, lineHeight}} />;
	}

	renderContextMenu() {
		const disabled = !this.props.stepping;
		return (
			<ContextMenu id="disasm">
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
		// TODO: Not by PC.  Something else.
		if (prevProps.pc !== this.props.pc) {
			this.updateDisasm(this.props.pc - 47 * 4);
		}

		if (this.state.lineHeight === 0) {
			const foundLine = document.querySelector('.DisasmLine');
			if (foundLine) {
				this.setState({ lineHeight: foundLine.clientHeight });
			}
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
}

Disasm.defaultProps = {
	ppsspp: null,
	log: null,
	pc: null,
};

export default Disasm;
