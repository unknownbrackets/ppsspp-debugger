import React, { Component } from 'react';
import classNames from 'classnames';

class DisasmBranchGuide extends Component {
	render() {
		const pos = this.calcPos();
		if (pos === null) {
			return null;
		}
		const classes = classNames({
			'DisasmBranchGuide': true,
			// TODO: Need cursor pos to highlight branch lines.
			'DisasmBranchGuide--selected': false,
		});

		return (
			<div className={classes} style={pos}>
				<svg xmlns="http://www.w3.org/2000/svg" width="8" height={pos.height}>
					<path d={this.buildPath(pos.height)} />
				</svg>
			</div>
		);
	}

	buildPath(height) {
		const { guide, range, lineHeight } = this.props;
		const yCenter = Math.floor(lineHeight / 2) + 0.5;

		// Parts: trailing connects to outside view.
		const trailingEdge = `m7.5,-${yCenter} l0,${lineHeight} m-7.5,-${lineHeight - yCenter}`;
		const sourceEdge = 'm3,0 l5,0 m-8,0';
		const arrowEdge = 'm5.5,-4 l-4,4 l4,4 m-3.5,-4 l6,0 m-8,0';

		// Start at the y center so our parts are reusable for top and bottom.
		let path = ['M0,' + yCenter];

		if (guide.top < range.start) {
			path.push(trailingEdge);
		} else if (guide.direction === 'up') {
			path.push(arrowEdge);
		} else {
			path.push(sourceEdge);
		}

		path.push('m7.5,0 l0,' + (height - lineHeight) + ' m-7.5,0');

		if (guide.bottom >= range.end) {
			path.push(trailingEdge);
		} else if (guide.direction === 'down') {
			path.push(arrowEdge);
		} else {
			path.push(sourceEdge);
		}

		return path;
	}

	calcPos() {
		const { guide } = this.props;
		const top = this.findAddressOffset(guide.top, false);
		const bottom = this.findAddressOffset(guide.bottom, true);
		if (top === null || bottom === null) {
			return null;
		}

		const right = (8 - guide.lane) * 8;
		const height = bottom - top;
		return { top, right, height };
	}

	findAddressOffset(address, down) {
		const { offsets, range } = this.props;
		if (address >= range.end) {
			if ((range.end - 4) in offsets && down) {
				return offsets[range.end - 4] + this.props.lineHeight;
			}
			if ((range.end - 8) in offsets && down) {
				return offsets[range.end - 8] + this.props.lineHeight;
			}
			return null;
		}

		let off;
		if (address < range.start && !down) {
			off = 0;
		} else if (address in offsets) {
			off = offsets[address];
		} else if (address - 4 in offsets) {
			// Inside a macro?
			off = offsets[address - 4];
		} else {
			return null;
		}

		return down ? off + this.props.lineHeight : off;
	}
}

DisasmBranchGuide.defaultProps = {
	guide: null,
	offsets: {},
	range: {},
	lineHeight: 0,
};

export default DisasmBranchGuide;