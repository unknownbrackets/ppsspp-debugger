import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import DisasmContextMenu from './DisasmContextMenu';
import DisasmList from './DisasmList';
import DisasmSearch from './DisasmSearch';
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
		searchString: null,
		searchInProgress: false,
		highlightText: null,
	};
	jumpStack = [];
	needsScroll = false;
	needsOffsetFix = false;
	updatesCancel = false;
	updatesSequence = Promise.resolve(null);
	lastSearch = null;
	ref;
	listRef;
	searchRef;
	listeners_;

	constructor(props) {
		super(props);

		this.ref = React.createRef();
		this.listRef = React.createRef();
		this.searchRef = React.createRef();
	}

	render() {
		const events = {
			onScroll: ev => this.onScroll(ev),
			onDragStart: ev => ev.preventDefault(),
		};

		if (!this.props.started) {
			return this.renderNotStarted();
		}

		return (
			<React.Fragment>
				<div ref={this.ref} className="Disasm" {...events}>
					<DisasmList ref={this.listRef} {...this.state}
						onDoubleClick={this.onDoubleClick}
						updateSelection={this.props.updateSelection}
						promptGoto={this.props.promptGoto}
						updateCursor={this.updateCursor}
						updateDisplaySymbols={this.updateDisplaySymbols}
						selectionTop={this.props.selectionTop}
						selectionBottom={this.props.selectionBottom}
						getSelectedDisasm={this.getSelectedDisasm}
						followBranch={this.followBranch}
						assembleInstruction={this.assembleInstruction}
						toggleBreakpoint={this.toggleBreakpoint}
						applyScroll={this.applyScroll}
						searchPrompt={this.searchPrompt}
						searchNext={this.searchNext}
					/>
				</div>
				{this.renderContextMenu()}
				<DisasmSearch ref={this.searchRef}
					searchString={this.state.searchString}
					searchNext={this.searchNext}
					updateSearchString={this.updateSearchString}
					inProgress={this.state.searchInProgress}
				/>
			</React.Fragment>
		);
	}

	renderNotStarted() {
		return (
			<div className="Disasm--not-started">
				Waiting for a game to start...
			</div>
		);
	}

	renderContextMenu() {
		return <DisasmContextMenu
			ppsspp={this.props.ppsspp}
			log={this.props.log}
			stepping={this.props.stepping}
			currentThread={this.props.currentThread}
			getSelectedLines={this.getSelectedLines}
			getSelectedDisasm={this.getSelectedDisasm}
			followBranch={this.followBranch}
			assembleInstruction={this.assembleInstruction}
			toggleBreakpoint={this.toggleBreakpoint}
		/>;
	}

	updateCursor = (cursor) => {
		if (this.state.cursor !== cursor) {
			this.needsScroll = 'nearest';
			this.setState({ cursor });

			this.updatesSequence = this.updatesSequence.then(() => {
				if (this.updatesCancel) {
					return null;
				}

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
					return this.updateDisasmNow('nearest', { address: start, end });
				}
				return null;
			});
		}
	}

	getSelectedLines = () => {
		const { selectionTop, selectionBottom } = this.props;
		const isSelected = line => line.address + line.addressSize > selectionTop && line.address <= selectionBottom;
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
		if (direction) {
			let target = line.branch && line.branch.targetAddress;
			if (target === null) {
				target = line.relevantData && line.relevantData.address;
			}
			if (target !== null) {
				this.jumpStack.push(this.state.cursor);
				this.gotoAddress(target);
			}
		} else {
			if (this.jumpStack.length !== 0) {
				this.gotoAddress(this.jumpStack.pop());
			} else {
				this.gotoAddress(this.props.pc);
			}
		}
	}

	assembleInstruction = (line, startCode) => {
		const { address } = line;
		const code = prompt('Assemble instruction', startCode);
		if (!code) {
			return Promise.resolve(null);
		}

		const writeInstruction = () => {
			return this.props.ppsspp.send({
				event: 'memory.assemble',
				address: address,
				code,
			}).then(() => {
				if (address === this.state.cursor) {
					// Okay, move one down so we can fire 'em off.
					const lineIndex = this.state.lines.indexOf(line);
					if (lineIndex < this.state.lines.length - 1) {
						const nextAddress = this.state.lines[lineIndex + 1].address;
						this.gotoAddress(nextAddress, 'nearest');
					}
				}

				// Now, whether we moved or not, also update disasm.
				this.updateDisasm();
			});
		};

		// Check if this is actually a register assignment.
		const assignment = code.split(/\s*=\s*(.+)$/, 2);
		if (assignment.length >= 2) {
			return this.props.ppsspp.send({
				event: 'cpu.evaluate',
				thread: this.props.currentThread,
				expression: assignment[1],
			}).then((result) => {
				return this.props.ppsspp.send({
					event: 'cpu.setReg',
					thread: this.props.currentThread,
					name: assignment[0],
					value: result.uintValue,
				});
			}).then(({ uintValue }) => {
				this.props.log('Updated ' + assignment[0] + ' to ' + toString08X(uintValue));
			}, writeInstruction);
		} else {
			return writeInstruction();
		}
	}

	toggleBreakpoint = (line) => {
		if (line.breakpoint === null) {
			this.props.ppsspp.send({
				event: 'cpu.breakpoint.add',
				address: line.address,
				enabled: true,
			});
		} else if (!line.breakpoint.enabled) {
			this.props.ppsspp.send({
				event: 'cpu.breakpoint.update',
				address: line.address,
				enabled: true,
			});
		} else {
			if (line.breakpoint.condition !== null) {
				if (!window.confirm('This breakpoint has has a condition.\n\nAre you sure you want to remove it?')) {
					return;
				}
			}

			this.props.ppsspp.send({
				event: 'cpu.breakpoint.remove',
				address: line.address,
			});
		}
	}

	gotoAddress = (addr, snap = 'center') => {
		this.needsScroll = snap;
		this.props.updateSelection({
			selectionTop: addr,
			selectionBottom: addr,
		});
	}

	searchDisasm = (cont) => {
		const continueLast = cont && this.lastSearch !== null;
		const { cursor, searchString } = this.state;
		if (!continueLast && !searchString) {
			// Prompt for a term so we can even do this.
			this.searchPrompt();
			return;
		}

		if (this.state.searchInProgress) {
			if (continueLast) {
				// Already doing that, silly.
				return;
			}

			this.searchCancel();
		}

		if (!continueLast) {
			this.lastSearch = {
				match: searchString,
				end: cursor,
				last: null,
			};
		}

		// Set a new object so we can detect cancel uniquely.
		const cancelState = { cancel: false };
		this.lastSearch.cancelState = cancelState;
		this.setState({ searchInProgress: true });

		const { match, end, last } = this.lastSearch;
		this.props.ppsspp.send({
			event: 'memory.searchDisasm',
			address: cursor === last ? cursor + 4 : cursor,
			end,
			match,
		}).then(({ address }) => {
			if (cancelState.cancel) {
				return;
			}
			if (this.lastSearch) {
				this.lastSearch.last = address;
			}

			if (address !== null) {
				this.gotoAddress(address);
			} else if (cursor !== end) {
				window.alert('Reached the starting point of the search');
				this.gotoAddress(end);
			} else {
				window.alert('The specified text was not found:\n\n' + match);
			}
		}).finally(() => {
			if (!cancelState.cancel) {
				this.setState({ searchInProgress: false });
				if (this.lastSearch) {
					this.lastSearch.cancelState = null;
				}
			}
		});
	}

	updateSearchString = (match) => {
		const highlightText = match ? match.toLowerCase() : null;
		this.setState({ highlightText, searchString: match });
		if (this.lastSearch && this.lastSearch.match !== match) {
			// Clear the search start position when changing the search.
			this.searchCancel();
			this.lastSearch = null;
		}

		if (match === null) {
			// Return focus to list.
			if (this.listRef.current) {
				this.listRef.current.ensureCursorInView(false);
			}
		}
	}

	searchPrompt = () => {
		this.updateSearchString(this.state.searchString || (this.lastSearch ? this.lastSearch.match : ''));
		this.searchRef.current.focus();
	}

	searchNext = () => {
		this.searchDisasm(true);
	}

	searchCancel = () => {
		if (this.lastSearch && this.lastSearch.cancelState) {
			this.lastSearch.cancelState.cancel = true;
			this.setState({ searchInProgress: false });
			this.lastSearch.cancelState = null;
		}
	}

	getSnapshotBeforeUpdate(prevProps, prevState) {
		if (this.needsOffsetFix && this.listRef.current && this.state.lines.length !== 0) {
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
		this.listeners_ = listeners.listen({
			'connection': () => {
				if (this.props.started) {
					this.updateDisasm('center');
				}
			},
			'cpu.stepping': () => {
				const hasRange = this.state.range.start !== 0 || this.state.range.end !== 0;
				this.updateDisasm(hasRange ? 'nearest' : 'center');
			},
			'cpu.setReg': (result) => {
				// Need to re-render if pc is changed.
				if (result.category === 0 && result.register === 32) {
					this.updateDisasm('center');
				}
			},
			'cpu.breakpoint.add': () => {
				this.updateDisasm();
			},
			'cpu.breakpoint.update': () => {
				this.updateDisasm();
			},
			'cpu.breakpoint.remove': () => {
				this.updateDisasm();
			},
		});
		this.updatesCancel = false;
	}

	componentWillUnmount() {
		this.searchCancel();
		this.updatesCancel = true;
		listeners.forget(this.listeners_);
	}

	componentDidUpdate(prevProps, prevState, snapshot) {
		const { selectionTop, selectionBottom } = this.props;
		const { range, lineHeight } = this.state;

		let disasmChange = null, updateDisasmRange = null;
		if (this.state.wantDisplaySymbols !== prevState.displaySymbols) {
			// Keep the existing range, just update.
			disasmChange = false;
		}
		if (this.props.currentThread !== prevProps.currentThread) {
			disasmChange = false;
		}
		if (selectionTop !== prevProps.selectionTop || selectionBottom !== prevProps.selectionBottom) {
			if (selectionTop < range.start || selectionBottom >= range.end) {
				disasmChange = 'center';
				updateDisasmRange = true;
			}
		}
		if (disasmChange !== null) {
			this.updateDisasm(disasmChange, updateDisasmRange);
		}

		if (lineHeight === 0) {
			const foundLine = document.querySelector('.DisasmLine');
			if (foundLine) {
				// Defer for other updates.
				setTimeout(() => this.setState({ lineHeight: foundLine.getBoundingClientRect().height }), 0);
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
			const list = this.listRef.current;
			setTimeout(() => {
				list.ensureCursorInView(this.needsScroll);
				this.needsScroll = false;
			}, 0);
		}

		if (snapshot && this.listRef.current) {
			const top = this.listRef.current.addressBoundingTop(snapshot.centerAddress);
			this.ref.current.scrollTop -= snapshot.top - top;
			this.needsOffsetFix = false;
		}
	}

	updateDisasm(needsScroll, newRange) {
		this.updatesSequence = this.updatesSequence.then(() => {
			if (this.updatesCancel) {
				return null;
			}
			return this.updateDisasmNow(needsScroll, newRange);
		});
	}

	updateDisasmNow(needsScroll, newRange = null) {
		const { range, visibleLines, wantDisplaySymbols: displaySymbols } = this.state;
		let updateRange = newRange;
		if (newRange === true || (newRange === null && range.start === 0 && range.end === 0)) {
			const minBuffer = Math.max(MIN_BUFFER, visibleLines);
			const defaultBuffer = Math.floor(minBuffer * 1.5);
			updateRange = {
				address: this.props.selectionTop - defaultBuffer * 4,
				count: defaultBuffer * 2,
			};
		} else if (newRange === null) {
			updateRange = {
				address: range.start,
				end: range.end,
			};
		}

		return Promise.resolve(null).then(() => {
			return this.props.ppsspp.send({
				event: 'memory.disasm',
				thread: this.props.currentThread,
				...updateRange,
				displaySymbols,
			}).then((data) => {
				if (this.updatesCancel) {
					return;
				}

				const { range, branchGuides, lines } = data;
				if (needsScroll) {
					this.needsScroll = needsScroll;
				} else {
					this.needsOffsetFix = true;
				}
				this.setState({ range, branchGuides: this.cleanupBranchGuides(branchGuides), lines, displaySymbols });
			}, (err) => {
				if (!this.updatesCancel) {
					this.setState({ range: { start: 0, end: 0 }, branchGuides: [], lines: [] });
				}
			});
		});
	}

	cleanupBranchGuides(branchGuides) {
		// TODO: Temporary (?) workaround for a bug with duplicate branch guides.
		const unique = new Map();
		branchGuides.forEach((guide) => {
			const key = String(guide.top) + String(guide.bottom) + guide.direction;
			unique.set(key, guide);
		});
		return [...unique.values()];
	}

	onDoubleClick = (ev, data) => {
		this.toggleBreakpoint(data.line);
	}

	applyScroll = (dist) => {
		this.ref.current.scrollTop += dist * this.state.lineHeight;
	}

	onScroll(ev) {
		this.updatesSequence = this.updatesSequence.then(() => {
			if (this.updatesCancel) {
				return null;
			}

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
				return this.updateDisasmNow(false, { address: start, end });
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
		const { selectionTop, selectionBottom } = nextProps;
		if (prevState.cursor < selectionTop || prevState.cursor > selectionBottom) {
			let cursor = selectionTop;
			if (prevState.lines.length) {
				// Snap to in case we goto an address in the middle
				const line = prevState.lines.find(l => l.address <= selectionTop && l.address + l.addressSize > selectionTop);
				cursor = line ? line.address : cursor;
			}
			return { cursor };
		}
		return null;
	}
}

Disasm.propTypes = {
	ppsspp: PropTypes.object.isRequired,
	log: PropTypes.func.isRequired,
	selectionTop: PropTypes.number,
	selectionBottom: PropTypes.number,
	stepping: PropTypes.bool.isRequired,
	started: PropTypes.bool.isRequired,
	paused: PropTypes.bool.isRequired,
	pc: PropTypes.number,
	currentThread: PropTypes.number,

	updateSelection: PropTypes.func.isRequired,
	promptGoto: PropTypes.func.isRequired,
};

export default Disasm;
