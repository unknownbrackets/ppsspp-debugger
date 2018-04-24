import React, { Component } from 'react';
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

		return <div className="Disasm">
			{this.state.lines.map((line) => (
				<DisasmLine key={line.address} line={line} displaySymbols={this.state.displaySymbols} />
			))}

			{this.state.branchGuides.map((guide) => this.renderBranchGuide(guide, offsets))}
		</div>;
	}

	renderBranchGuide(guide, offsets) {
		const key = String(guide.top) + String(guide.bottom) + guide.direction;
		const { range, lineHeight } = this.state;
		return <DisasmBranchGuide {...{key, guide, range, offsets, lineHeight}} />;
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
}

Disasm.defaultProps = {
	ppsspp: null,
	log: null,
	pc: null,
};

export default Disasm;
