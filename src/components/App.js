import React, { Component } from 'react';
import PPSSPP from '../sdk/ppsspp.js';
import logo from '../assets/logo.svg';
import './App.css';

class App extends Component {
	constructor(props) {
		super(props);
		this.state = {
			ppsspp: null,
			connecting: false,
		};
	}

	render() {
		return (
			<div className="App">
				<header className="App-header">
					<img src={logo} className="App-logo" alt="logo" />
					<h1 className="App-title">Welcome to React</h1>
				</header>
				<p className="App-intro">
					To get started, edit <code>src/App.js</code> and save to reload.
				</p>
				<div>{this.button()}</div>
			</div>
		);
	}

	button() {
		if (this.state.connecting) {
			return <button disabled="disabled">Connecting...</button>;
		} else if (this.state.ppsspp) {
			return <button onClick={this.handleDisconnect}>Disconnect</button>;
		}
		return <button onClick={this.handleConnect}>Connect</button>;
	}

	handleConnect = () => {
		let ppsspp = new PPSSPP();
		this.setState({ connecting: true });

		ppsspp.onError = (message, level) => {
			console.log(message);
		};
		ppsspp.onClose = () => {
			console.log('Disconnected');
			this.setState({ ppsspp: null, connecting: false });
		};

		ppsspp.autoConnect().then(() => {
			console.log('Connected');
			this.setState({ ppsspp, connecting: false });
		}, err => {
			console.log('Connect failed', err);
			this.setState({ ppsspp: null, connecting: false });
		});
	}

	handleDisconnect = () => {
		// Should trigger the appropriate events automatically.
		this.state.ppsspp.disconnect();
	}
}

export default App;
