import PropTypes from 'prop-types';
import Log from './Log';
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

	const mainDiv = (
		<div className="NotConnected__main">
			{props.connecting ? 'Connecting to PPSSPP...' : 'Not connected to PPSSPP'}

			<div className="NotConnected__info">
				Make sure &quot;Allow remote debugger&quot; is enabled in Developer tools.
			</div>
			<form className="NotConnected__form" onSubmit={connectManually}>
				<input type="text" name="debugger-uri" placeholder="ws://ip:port/debugger" className="NotConnected__uri" />
				<button type="submit" disabled={props.connecting}>Connect Manually</button>
			</form>
			<form className="NotConnected__form" onSubmit={connectAutomatically}>
				<button type="submit" disabled={props.connecting}>Connect Automatically</button>
			</form>
		</div>
	);

	const utilityPanelDiv = (
		<div className="NotConnected__utilityPanel App-utilityPanel">
			<Log />
		</div>
	);

	return (
		<div id="NotConnected">
			{mainDiv}
			{utilityPanelDiv}
		</div>
	);
}

NotConnected.propTypes = {
	connect: PropTypes.func.isRequired,
};
