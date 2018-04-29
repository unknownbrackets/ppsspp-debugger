import React, { Component } from 'react';
import CPU from './CPU';
import Log from './Log';
import PPSSPP from '../sdk/ppsspp.js';
import listeners from '../utils/listeners.js';
import logo from '../assets/logo.svg';
import './App.css';

const versionInfo = {
	name: process.env.REACT_APP_NAME,
	version: process.env.REACT_APP_VERSION,
};

class App extends Component {
	state = {
		connected: false,
		connecting: false,
	};
	logRef;
	ppsspp;
	originalTitle;

	constructor(props) {
		super(props);

		this.logRef = React.createRef();
		this.ppsspp = new PPSSPP();
		this.originalTitle = document.title;

		listeners.init(this.ppsspp);
		listeners.listen({
			'connection.change': this.onConnectionChange,
			'game.start': this.updateTitle,
			'game.quit': this.updateTitle,
		});
	}

	render() {
		return (
			<div className="App">
				<header className="App-header">
					<div className="App-button">{this.button()}</div>
					<img src={logo} className="App-logo" alt="PPSSPP" />
					<h1 className="App-title">Debugger</h1>
				</header>
				<CPU ppsspp={this.ppsspp} log={this.log} />
				<Log ppsspp={this.ppsspp} ref={this.logRef} />
			</div>
		);
	}

	button() {
		if (this.state.connecting) {
			return <button disabled="disabled">Connecting...</button>;
		} else if (this.state.connected) {
			return <button onClick={this.handleDisconnect}>Disconnect</button>;
		}
		return <button onClick={this.handleConnect}>Connect</button>;
	}

	componentDidMount() {
		// Connect automatically on start.
		this.handleConnect();
	}

	handleConnect = () => {
		this.setState({ connecting: true });

		this.ppsspp.onClose = () => {
			this.log('Debugger disconnected');
			listeners.change(false);
			this.setState({ connected: false, connecting: false });
		};

		this.ppsspp.autoConnect().then(() => {
			this.log('Debugger connected');
			listeners.change(true);
			this.setState({ connected: true, connecting: false });
		}, err => {
			this.log('Debugger could not connect');
			listeners.change(false);
			this.setState({ connected: false, connecting: false });
		});
	}

	handleDisconnect = () => {
		// Should trigger the appropriate events automatically.
		this.ppsspp.disconnect();
	}

	log = (message) => {
		// Would rather keep Log managing its state, and pass this callback around.
		this.logRef.current.addLogItem({ message: message + '\n' });
	}

	updateTitle = (data) => {
		if (data.game) {
			document.title = this.originalTitle + ' - ' + data.game.id + ': ' + data.game.title;
		} else {
			document.title = this.originalTitle;
		}
	}

	onConnectionChange = (status) => {
		if (status) {
			this.ppsspp.send({ event: 'version', ...versionInfo }).catch((err) => {
				window.alert('PPSSPP seems to think this debugger is out of date.  Try refreshing?\n\nDetails: ' + err);
			});
			this.ppsspp.send({ event: 'game.status' }).then(this.updateTitle, (err) => this.updateTitle({}));
		} else {
			this.updateTitle({});
		}
	}
}

export default App;
