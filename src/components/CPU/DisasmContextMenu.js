import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ContextMenu, MenuItem, connectMenu } from 'react-contextmenu';
import { copyText } from '../../utils/clipboard';
import { toString08X } from '../../utils/format';

class DisasmContextMenu extends PureComponent {
	render() {
		const { id, trigger } = this.props;
		const disabled = !this.props.stepping;
		const line = trigger && trigger.line;

		const followBranch = line && (line.branch !== null || line.relevantData !== null || line.type === 'data');

		return (
			<ContextMenu id={id}>
				<MenuItem onClick={this.handleCopyAddress}>
					Copy Address
				</MenuItem>
				<MenuItem onClick={this.handleCopyHex}>
					Copy Instruction (Hex)
				</MenuItem>
				<MenuItem onClick={this.handleCopyDisasm}>
					Copy Instruction (Disasm)
				</MenuItem>
				<MenuItem divider />
				<MenuItem disabled={disabled} onClick={this.handleAssemble}>
					Assemble Opcode...
				</MenuItem>
				<MenuItem divider />
				<MenuItem disabled={disabled} onClick={this.handleRunUntil}>
					Run to Cursor
				</MenuItem>
				<MenuItem disabled={disabled} onClick={this.handleJumpPC}>
					Jump to Cursor
				</MenuItem>
				<MenuItem onClick={this.handleToggleBreakpoint}>
					Toggle Breakpoint
				</MenuItem>
				<MenuItem divider />
				<MenuItem disabled={!followBranch} onClick={this.handleFollowBranch}>
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

	handleCopyAddress = (ev, data) => {
		copyText(toString08X(data.line.address));
		data.node.focus();
	}

	handleCopyHex = (ev, data) => {
		const hexLines = this.props.getSelectedLines().map(line => {
			// Include each opcode of a macro if it's a macro.
			return line.macroEncoding ? line.macroEncoding.map(toString08X).join("\n") : toString08X(line.encoding);
		});
		copyText(hexLines.join("\n"));
		data.node.focus();
	}

	handleCopyDisasm = (ev, data) => {
		const lines = this.props.getSelectedDisasm();
		copyText(lines);
		data.node.focus();
	}

	handleAssemble = (ev, data) => {
		// Delay so the context menu can close before the prompt.
		setTimeout(() => {
			this.props.assembleInstruction(data.line, '').catch(() => {
				// Exception logged.
			});
		}, 0);
	}

	handleRunUntil = (ev, data) => {
		this.props.ppsspp.send({
			event: 'cpu.runUntil',
			address: data.line.address,
		}).catch(() => {
			// Already logged, let's assume the parent will have marked it disconnected/not started by now.
		});
		data.node.focus();
	}

	handleJumpPC = (ev, data) => {
		this.props.ppsspp.send({
			event: 'cpu.setReg',
			thread: this.props.currentThread,
			name: 'pc',
			value: data.line.address,
		}).catch((err) => {
			this.props.log('Failed to update PC: ' + err);
		});
	}

	handleToggleBreakpoint = (ev, data) => {
		this.props.toggleBreakpoint(data.line);
	}

	handleFollowBranch = (ev, data) => {
		this.props.followBranch(true, data.line);
	}

	handleTodo = (ev, data) => {
		// TODO
		console.log(data);
		data.node.focus();
	}
}

DisasmContextMenu.propTypes = {
	id: PropTypes.string.isRequired,
	trigger: PropTypes.shape({
		line: PropTypes.shape({
			type: PropTypes.string,
			branch: PropTypes.object,
			relevantData: PropTypes.object,
		}),
	}),
	ppsspp: PropTypes.object.isRequired,
	log: PropTypes.func.isRequired,
	stepping: PropTypes.bool.isRequired,
	currentThread: PropTypes.number,

	getSelectedLines: PropTypes.func.isRequired,
	getSelectedDisasm: PropTypes.func.isRequired,
	followBranch: PropTypes.func.isRequired,
	assembleInstruction: PropTypes.func.isRequired,
	toggleBreakpoint: PropTypes.func.isRequired,
};

export default connectMenu('disasm')(DisasmContextMenu);
