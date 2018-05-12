import React from 'react';
import PropTypes from 'prop-types';
import './NotConnected.css';

export default function NotConnected(props) {
	const connectManually = (ev) => {
		const uri = ev.target.elements['debugger-uri'].value;
		props.connect(uri);
		ev.preventDefault();
	};
	const connectAutomatically = (ev) => {
		props.connect(null);
		ev.preventDefault();
	};

	return (
		<div id="NotConnected">
			Not connected to PPSSPP.
			<form className="NotConnected__form" onSubmit={connectManually}>
				<input type="text" name="debugger-uri" placeholder="ws://ip:port/debugger" className="NotConnected__uri" />
				<button disabled={props.connecting}>Connect Manually</button>
			</form>
			<form className="NotConnected__form" onSubmit={connectAutomatically}>
				<button disabled={props.connecting}>Connect Automatically</button>
			</form>
		</div>
	);
}

NotConnected.propTypes = {
	connect: PropTypes.func.isRequired,
};
