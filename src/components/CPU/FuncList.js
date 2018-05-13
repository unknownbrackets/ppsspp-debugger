import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { AutoSizer, List } from 'react-virtualized';
import listeners from '../../utils/listeners.js';
import 'react-virtualized/styles.css';
import './FuncList.css';

class FuncList extends PureComponent {
	state = {
		connected: false,
		// Lots of functions can take a while...
		loading: true,
		rowHeight: null,
		functions: [],
		filter: '',
		filteredFunctions: [],
	};
	listeners_;

	render() {
		const { filter } = this.state;
		return (
			<div className="FuncList">
				<input type="search" className="FuncList__search" value={filter} onChange={this.handleFilter} />
				{this.renderList()}
			</div>
		);
	}

	renderList() {
		const { filter, loading, rowHeight } = this.state;
		if (loading || !rowHeight) {
			return <div className="FuncList__loading">Loading...</div>;
		}

		return (
			<div className="FuncList__listing" onClick={this.handleClick}>
				<AutoSizer filter={filter}>{this.renderSizedList}</AutoSizer>
			</div>
		);
	}

	renderSizedList = ({ height, width }) => {
		const { filter, filteredFunctions, rowHeight } = this.state;
		return (
			<List
				height={height}
				rowHeight={rowHeight}
				rowRenderer={this.renderFunc}
				width={width}
				rowCount={filteredFunctions.length}
				filter={filter}
			/>
		);
	}

	renderFunc = ({ index, key, style }) => {
		const func = this.state.filteredFunctions[index];
		return (
			<div key={key + '-' + func.address} style={style}>
				<button type="button" data-address={func.address}>{func.name}</button>
			</div>
		);
	}

	componentDidMount() {
		this.listeners_ = listeners.listen({
			'connection.change': (connected) => this.setState({ connected }),
			'game.start': () => this.updateList(),
		});
		if (this.state.connected) {
			this.updateList();
		}
		if (!this.state.rowHeight) {
			setTimeout(() => this.measureHeight(), 0);
		}
	}

	componentWillUnmount() {
		listeners.forget(this.listeners_);
	}

	componentDidUpdate(prevProps, prevState) {
		if (!prevState.connected && this.state.connected) {
			this.updateList();
		}
		if (!this.state.rowHeight) {
			setTimeout(() => this.measureHeight(), 0);
		}
	}

	measureHeight() {
		const node = document.querySelector('.FuncList__loading');
		if (node) {
			const rowHeight = node.getBoundingClientRect().height;
			this.setState({ rowHeight });
		}
	}

	updateList() {
		if (!this.state.connected) {
			// This avoids a duplicate update during initial connect.
			return;
		}

		if (!this.state.loading && this.state.functions.length === 0) {
			this.setState({ loading: true });
		}

		this.props.ppsspp.send({
			event: 'hle.func.list',
		}).then(({ functions }) => {
			const filteredFunctions = this.applyFilter(functions, this.state.filter);
			this.setState({ functions, filteredFunctions, loading: false });
		}, () => {
			this.setState({ functions: [], filteredFunctions: [], loading: false });
		});
	}

	applyFilter(functions, filter) {
		const match = filter.toLowerCase();
		return functions.filter(func => func.name.toLowerCase().indexOf(match) !== -1);
	}

	handleFilter = (ev) => {
		const filter = ev.target.value;
		const filteredFunctions = this.applyFilter(this.state.functions, filter);
		this.setState({ filter, filteredFunctions });
	}

	handleClick = (ev) => {
		const { address } = ev.target.dataset;
		this.props.gotoDisasm(Number(address));
		ev.preventDefault();
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		let update = null;
		if (nextProps.started) {
			update = { ...update, connected: true };
		}
		if (!nextProps.started && prevState.functions.length) {
			update = { ...update, functions: [], filteredFunctions: [] };
		}
		return update;
	}
}

FuncList.propTypes = {
	ppsspp: PropTypes.object.isRequired,
	log: PropTypes.func.isRequired,
	gotoDisasm: PropTypes.func.isRequired,
};

export default FuncList;
