import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classNames from 'clsx';
import './DisasmSearch.css';

class DisasmSearch extends PureComponent {
	ref;

	constructor(props) {
		super(props);
		this.ref = React.createRef();
	}

	render() {
		const value = this.props.searchString || '';
		const classes = classNames('DisasmSearch__field', { 'DisasmSearch__field--progress': this.props.inProgress });

		return (
			/* eslint no-script-url: "off" */
			<form action="#" className="DisasmSearch" hidden={this.props.searchString === null} onSubmit={this.handleNext}>
				<div className={classes}>
					<input type="search" value={value} placeholder="Find..." onChange={this.handleChange} onKeyDown={this.handleKeyDown} ref={this.ref} />
				</div>
				<button type="submit">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="15" height="15" role="img">
						<title>Search / Next</title>
						<path d="M10,50 l80,0 l-35,-40 m35,40 l-35,40" />
					</svg>
				</button>
				<button type="button" onClick={this.handleCancel}>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="15" height="15" role="img">
						<title>Cancel</title>
						<path d="M30,30 l120,120 m-120,0 l120,-120" />
					</svg>
				</button>
			</form>
		);
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevProps.searchString === null && this.props.searchString !== null) {
			this.focus();
		}
	}

	handleChange = (ev) => {
		this.props.updateSearchString(ev.target.value);
	}

	handleNext = (ev) => {
		this.props.searchNext();
		this.focus();
		ev.preventDefault();
	}

	handleCancel = (ev) => {
		this.props.updateSearchString(null);
	}

	handleKeyDown = (ev) => {
		if (ev.key === 'Escape') {
			this.handleCancel();
			ev.preventDefault();
		}
	}

	focus() {
		this.ref.current.focus();
	}
}

DisasmSearch.propTypes = {
	searchString: PropTypes.string,
	inProgress: PropTypes.bool.isRequired,
	updateSearchString: PropTypes.func.isRequired,
	searchNext: PropTypes.func.isRequired,
};

export default DisasmSearch;
