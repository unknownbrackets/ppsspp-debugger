import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import listeners from '../../utils/listeners.js';
import './FuncList.css';

class FuncList extends PureComponent {
	state = {
		connected: false,
		// Lots of functions can take a while...
		loading: true,
		functions: [],
		filter: '',
	};
	listeners_;

	render() {
		return (
			<div className="FuncList">
				<input type="search" className="FuncList__search" value={this.state.filter} onChange={this.handleFilter} />
				<ol className="FuncList__listing" onClick={this.handleClick}>
					{this.state.functions.map(func => this.renderFunc(func))}
				</ol>
				{this.state.loading ? <div className="FuncList__loading">Loading...</div> : ''}
			</div>
		);
	}

	renderFunc(func) {
		const { filter } = this.state;
		if (filter.length !== 0) {
			if (func.name.toLowerCase().indexOf(filter.toLowerCase()) === -1) {
				return null;
			}
		}

		return (
			<li key={func.address}>
				<button type="button" data-address={func.address}>{func.name}</button>
			</li>
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
	}

	componentWillUnmount() {
		listeners.forget(this.listeners_);
	}

	componentDidUpdate(prevProps, prevState) {
		if (!prevState.connected && this.state.connected) {
			this.updateList();
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
			this.setState({ functions, loading: false });
		}, () => {
			this.setState({ functions: [], loading: false });
		});
	}

	handleFilter = (ev) => {
		const filter = ev.target.value;
		this.setState({ filter });
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
			update = { ...update, functions: [] };
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
