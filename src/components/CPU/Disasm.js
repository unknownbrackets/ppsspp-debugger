import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import DisasmContextMenu from './DisasmContextMenu';
import DisasmList from './DisasmList';
import { toString08X } from '../../utils/format';
import listeners from '../../utils/listeners.js';
import './Disasm.css';

const MIN_BUFFER = 100;
const MAX_BUFFER = 500;

class Disasm extends PureComponent {
	state = {
		lines: [],
		branchGuides: [],
		range: { start: 0, end: 0 },
		lineHeight: 0,
		visibleLines: 0,
		displaySymbols: true,
		wantDisplaySymbols: true,
		cursor: null,
	};
	jumpStack = [];
	needsScroll = false;
	needsOffsetFix = false;
	updatesSequence = Promise.resolve(null);
	ref;
	listRef;

	constructor(props) {
		super(props);

		this.ref = React.createRef();
		this.listRef = React.createRef();
	}

	render() {
		const events = {
			onScroll: ev => this.onScroll(ev),
			onDragStart: ev => ev.preventDefault(),
		};

		return (
			<React.Fragment>
				<div ref={this.ref} className="Disasm" {...events}>
					<DisasmList ref={this.listRef} {...this.state}
						onDoubleClick={this.onDoubleClick}
						updateSelection={this.props.updateSelection}
						updateCursor={this.updateCursor}
						updateDisplaySymbols={this.updateDisplaySymbols}
						selectionTop={this.props.selectionTop}
						selectionBottom={this.props.selectionBottom}
						getSelectedDisasm={this.getSelectedDisasm}
						followBranch={this.followBranch}
					/>
				</div>
				{this.renderContextMenu()}
			</React.Fragment>
		);
	}

	renderContextMenu() {
		return <DisasmContextMenu
			ppsspp={this.props.ppsspp}
			log={this.props.log}
			stepping={this.props.stepping}
			getSelectedLines={this.getSelectedLines}
			getSelectedDisasm={this.getSelectedDisasm}
			followBranch={this.followBranch}
		/>;
	}

	updateCursor = (cursor) => {
		if (this.state.cursor !== cursor) {
			this.needsScroll = 'nearest';
			this.setState({ cursor });

			this.updatesSequence = this.updatesSequence.then(() => {
				let { start, end } = this.state.range;
				const minBuffer = Math.max(MIN_BUFFER, this.state.visibleLines);
				const maxBuffer = Math.max(MAX_BUFFER, this.state.visibleLines * 5);

				// This is here for keyboard scrolling, mainly.
				if (cursor - minBuffer * 4 < start) {
					start = cursor - minBuffer * 2 * 4;
				} else if (cursor - maxBuffer * 4 > start) {
					start = cursor - (maxBuffer - minBuffer) * 4;
				}
				if (cursor + minBuffer * 4 > end) {
					end = cursor + minBuffer * 2 * 4;
				} else if (cursor + maxBuffer * 4 < end) {
					end = cursor + (maxBuffer - minBuffer) * 4;
				}

				if (start !== this.state.range.start || end !== this.state.range.end) {
					return this.updateDisasmNow({ start, end });
				}
				return null;
			});
		}
	}

	getSelectedLines = () => {
		const { selectionTop, selectionBottom } = this.props;
		const isSelected = line => line.address >= selectionTop && line.address <= selectionBottom;
		return this.state.lines.filter(isSelected);
	}

	getSelectedDisasm = () => {
		const lines = this.getSelectedLines();

		// Gather all branch targets without labels.
		let branchAddresses = {};
		const unlabeledBranches = lines.map(l => l.branch).filter(b => b && !b.symbol && b.targetAddress);
		for (const b of unlabeledBranches) {
			branchAddresses[b.targetAddress] = 'pos_' + toString08X(b.targetAddress);
		}

		let result = '';
		let firstLine = true;
		for (const l of lines) {
			const label = l.symbol || branchAddresses[l.address];
			if (label) {
				if (!firstLine) {
					result += '\n';
				}
				result += label + ':\n\n';
			}

			result += '\t' + l.name + ' ';
			if (l.branch && l.branch.targetAddress && !l.branch.symbol) {
				// Use the generated label.
				result += l.params.replace(/0x[0-9A-f]+/, branchAddresses[l.branch.targetAddress]);
			} else {
				result += l.params;
			}
			result += '\n';

			firstLine = false;
		}

		return result;
	}

	updateDisplaySymbols = (flag) => {
		this.setState({ wantDisplaySymbols: flag });
	}

	followBranch = (direction, line) => {
		const go = (pc) => {
			this.needsScroll = 'center';
			this.props.updateSelection({
				selectionTop: pc,
				selectionBottom: pc,
			});
		};

		if (direction) {
			let target = line.branch && line.branch.targetAddress;
			if (target === null) {
				target = line.relevantData && line.relevantData.address;
			}
			if (target !== null) {
				this.jumpStack.push(this.state.cursor);
				go(target);
			}
		} else {
			if (this.jumpStack.length !== 0) {
				go(this.jumpStack.pop());
			} else {
				go(this.props.pc);
			}
		}
	}

	getSnapshotBeforeUpdate(prevProps, prevState) {
		if (this.needsOffsetFix && this.listRef.current) {
			const { lines } = this.state;
			const centerAddress = lines[Math.floor(lines.length / 2)].address;
			const top = this.listRef.current.addressBoundingTop(centerAddress);
			if (top) {
				return { top, centerAddress };
			}
		}
		return null;
	}

	componentDidMount() {
		listeners.listen({
			'connection': () => {
				if (this.props.started) {
					this.updateDisasm(null);
				}
			},
			'cpu.setReg': (result) => {
				// Need to re-render if pc is changed.
				if (result.category === 0 && result.register === 32) {
					this.updateDisasm(null);
				}
			},
		});
	}

	componentDidUpdate(prevProps, prevState, snapshot) {
		const { selectionTop, selectionBottom } = this.props;
		const { range, lineHeight } = this.state;

		let disasmChange = false;
		if (this.state.wantDisplaySymbols !== prevState.displaySymbols) {
			// Keep the existing range, just update.
			disasmChange = this.state.range;
		}
		if (selectionTop !== prevProps.selectionTop || selectionBottom !== prevProps.selectionBottom) {
			if (selectionTop < range.start || selectionBottom >= range.end) {
				disasmChange = null;
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
		} else if (this.ref.current) {
			const visibleLines = Math.floor(this.ref.current.clientHeight / lineHeight);
			if (visibleLines !== this.state.visibleLines) {
				this.setState({ visibleLines });
			}
		}

		if (this.props.jumpMarker !== prevProps.jumpMarker) {
			this.needsScroll = 'center';
		}
		// Always associated with a state update.
		if (this.needsScroll && this.listRef.current) {
			this.listRef.current.ensureCursorInView(this.needsScroll);
			this.needsScroll = false;
		}

		if (snapshot && this.listRef.current) {
			const top = this.listRef.current.addressBoundingTop(snapshot.centerAddress);
			this.ref.current.scrollTop -= snapshot.top - top;
			this.needsOffsetFix = false;
		}
	}

	updateDisasm(newRange) {
		this.updatesSequence = this.updatesSequence.then(() => {
			return this.updateDisasmNow(newRange);
		});
	}

	updateDisasmNow(newRange) {
		const minBuffer = Math.max(MIN_BUFFER, this.state.visibleLines);
		const defaultBuffer = Math.floor(minBuffer * 1.5);
		const displaySymbols = this.state.wantDisplaySymbols;
		const updateRange = {
			address: newRange === null ? this.props.selectionTop - defaultBuffer * 4 : newRange.start,
			count: newRange === null ? defaultBuffer * 2 : undefined,
			end: newRange !== null ? newRange.end : undefined,
		};

		return Promise.resolve(null).then(() => {
			return this.props.ppsspp.send({
				event: 'memory.disasm',
				...updateRange,
				displaySymbols,
			}).then((data) => {
				const { range, branchGuides, lines } = data;
				if (newRange === null) {
					this.needsScroll = 'center';
				} else {
					this.needsOffsetFix = true;
				}
				this.setState({ range, branchGuides, lines, displaySymbols });
			}, (err) => {
				this.setState({ range: { start: 0, end: 0 }, branchGuides: [], lines: [] });
			});
		});
	}

	onDoubleClick = (ev, data) => {
		console.log('breakpoint', data);
	}

	onScroll(ev) {
		this.updatesSequence = this.updatesSequence.then(() => {
			const { bufferTop, bufferBottom } = this.bufferRange();
			const minBuffer = Math.max(MIN_BUFFER, this.state.visibleLines);
			const maxBuffer = Math.max(MAX_BUFFER, this.state.visibleLines * 5);
			let { start, end } = this.state.range;

			if (bufferTop < minBuffer) {
				start -= minBuffer * 4;
			} else if (bufferTop > maxBuffer) {
				start += Math.max(minBuffer, bufferTop - maxBuffer) * 4;
			}

			if (bufferBottom < minBuffer) {
				end += minBuffer * 4;
			} else if (bufferBottom > maxBuffer) {
				end -= Math.max(minBuffer, bufferBottom - maxBuffer) * 4;
			}

			if (start !== this.state.range.start || end !== this.state.range.end) {
				return this.updateDisasmNow({ start, end });
			}
			return null;
		});
	}

	bufferRange() {
		const { scrollHeight, scrollTop, clientHeight } = this.ref.current;
		const bufferTop = scrollTop / this.state.lineHeight;
		const bufferBottom = (scrollHeight - scrollTop - clientHeight) / this.state.lineHeight;
		const visibleEachDirection = Math.floor((this.state.visibleLines - 1) / 2);

		return {
			bufferTop: bufferTop + visibleEachDirection,
			bufferBottom: bufferBottom + visibleEachDirection,
		};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		if (prevState.cursor < nextProps.selectionTop || prevState.cursor > nextProps.selectionBottom) {
			return { cursor: nextProps.selectionTop };
		}
		return null;
	}
}

Disasm.propTypes = {
	ppsspp: PropTypes.object.isRequired,
	log: PropTypes.func.isRequired,
	updateSelection: PropTypes.func.isRequired,
	selectionTop: PropTypes.number,
	selectionBottom: PropTypes.number,
	stepping: PropTypes.bool.isRequired,
	started: PropTypes.bool.isRequired,
	pc: PropTypes.number,
};

export default Disasm;
