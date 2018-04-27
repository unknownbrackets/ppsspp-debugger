import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import DisasmContextMenu from './DisasmContextMenu';
import DisasmList from './DisasmList';
import listeners from '../../utils/listeners.js';
import './Disasm.css';

const MIN_BUFFER = 100;
const MAX_BUFFER = 500;

class Disasm extends PureComponent {
	constructor(props) {
		super(props);

		this.state = {
			lines: [],
			branchGuides: [],
			range: { start: 0, end: 0 },
			lineHeight: 0,
			visibleLines: 0,
			displaySymbols: true,
			wantDisplaySymbols: true,
			cursor: null,
		};
		this.updatesSequence = Promise.resolve(null);
		this.updatesPending = 0;

		this.ref = React.createRef();
		this.listRef = React.createRef();

		this.needsScroll = false;
		this.needsOffsetFix = false;

		listeners.listen({
			'connection': () => this.updateDisasm(null),
			'cpu.setReg': (result) => {
				// Need to re-render if pc is changed.
				if (result.category === 0 && result.register === 32) {
					this.updateDisasm(null);
				}
			},
		});
	}

	render() {
		const events = {
			onScroll: ev => this.onScroll(ev),
			onDragStart: ev => ev.preventDefault(),
		};

		return [
			<div key="disasm" ref={this.ref} className="Disasm" {...events}>
				<DisasmList ref={this.listRef} {...this.state}
					onDoubleClick={this.onDoubleClick}
					updateSelection={this.props.updateSelection}
					updateCursor={this.updateCursor}
					updateDisplaySymbols={this.updateDisplaySymbols}
					selectionTop={this.props.selectionTop}
					selectionBottom={this.props.selectionBottom}
				/>
			</div>,
			this.renderContextMenu(),
		];
	}

	renderContextMenu() {
		return <DisasmContextMenu key="menu"
			stepping={this.props.stepping}
			getSelectedLines={this.getSelectedLines}
		/>;
	}

	updateCursor = (cursor) => {
		if (this.state.cursor !== cursor) {
			this.needsScroll = 'nearest';
			this.setState({ cursor });

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
				if (this.updatesPending === 0) {
					this.updateDisasm({ start, end });
				}
			}
		}
	}

	getSelectedLines = () => {
		const { selectionTop, selectionBottom } = this.props;
		const isSelected = line => line.address >= selectionTop && line.address <= selectionBottom;
		return this.state.lines.filter(isSelected);
	}

	updateDisplaySymbols = (flag) => {
		this.setState({ wantDisplaySymbols: flag });
	}

	getSnapshotBeforeUpdate(prevProps, prevState) {
		if (this.needsOffsetFix && this.listRef.current) {
			const top = this.listRef.current.cursorBoundingTop();
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
		if (this.state.wantDisplaySymbols !== prevState.displaySymbols) {
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
			const top = this.listRef.current.cursorBoundingTop();
			this.ref.current.scrollTop -= snapshot.top - top;
			this.needsOffsetFix = false;
		}
	}

	updateDisasm(newRange) {
		const minBuffer = Math.max(MIN_BUFFER, this.state.visibleLines);
		const displaySymbols = this.state.wantDisplaySymbols;
		const updateRange = {
			address: newRange === null ? this.props.selectionTop - minBuffer * 4: newRange.start,
			count: newRange === null ? minBuffer * 2 : undefined,
			end: newRange !== null ? newRange.end : undefined,
		};

		this.updatesPending++;
		this.updatesSequence = this.updatesSequence.then(res => {
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
			}).finally(() => {
				this.updatesPending--;
			});
		});
	}

	onDoubleClick = (ev, data) => {
		console.log('breakpoint', data);
	}

	onScroll(ev) {
		const { scrollHeight, scrollTop, clientHeight } = ev.target;
		const bufferTop = scrollTop / this.state.lineHeight;
		const bufferBottom = (scrollHeight - scrollTop - clientHeight) / this.state.lineHeight;

		let { start, end } = this.state.range;
		const minBuffer = Math.max(MIN_BUFFER, this.state.visibleLines);
		const maxBuffer = Math.max(MAX_BUFFER, this.state.visibleLines * 5);

		if (bufferTop < minBuffer) {
			start -= minBuffer * 4;
		} else if (bufferTop > maxBuffer) {
			start += minBuffer * 4;
		}

		if (bufferBottom < minBuffer) {
			end += minBuffer * 4;
		} else if (bufferBottom > maxBuffer) {
			end -= minBuffer * 4;
		}

		if (start !== this.state.range.start || end !== this.state.range.end) {
			if (this.updatesPending === 0) {
				this.updateDisasm({ start, end });
			}
		}
	}
}

Disasm.propTypes = {
	ppsspp: PropTypes.object.isRequired,
	log: PropTypes.func.isRequired,
	updateSelection: PropTypes.func.isRequired,
	selectionTop: PropTypes.number,
	selectionBottom: PropTypes.number,
	stepping: PropTypes.bool.isRequired,
};

export default Disasm;
