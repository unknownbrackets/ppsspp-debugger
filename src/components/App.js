import React, { Component } from 'react';
import Log from './Log';
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

		this.logRef = React.createRef();
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
				<div className="App-button">{this.button()}</div>
				<Log ppsspp={this.state.ppsspp} ref={this.logRef} />
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

	componentDidMount() {
		// Connect automatically on start.
		this.handleConnect();
	}

	handleConnect = () => {
		let ppsspp = new PPSSPP();
		this.setState({ connecting: true });

		ppsspp.onClose = () => {
			this.log('Debugger disconnected');
			this.setState({ ppsspp: null, connecting: false });
		};

		ppsspp.autoConnect().then(() => {
			this.log('Debugger connected');
			this.setState({ ppsspp, connecting: false });
		}, err => {
			this.log('Debugger could not connect');
			this.setState({ ppsspp: null, connecting: false });
		});
	}

	handleDisconnect = () => {
		// Should trigger the appropriate events automatically.
		this.state.ppsspp.disconnect();
	}

	log = (message) => {
		// Would rather keep Log managing its state, and pass this callback around.
		this.logRef.current.addLogItem({ message: message + '\n' });
	}
}

export default App;
