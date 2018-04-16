import React, { Component } from 'react';
import PPSSPP from '../sdk/ppsspp.js';
import logo from '../assets/logo.svg';
import './App.css';

class App extends Component {
	render() {
		return (
			<div className="App">
				<header className="App-header">
					<img src={logo} className="App-logo" alt="logo" />
					<h1 className="App-title">Welcome to React</h1>
				</header>
				<p className="App-intro">
					To get started, edit <code>src/App.js</code> and save to reload.
					<div><button onClick={this.handleConnect}>Connect</button></div>
				</p>
			</div>
		);
	}

	handleConnect = () => {
		let ppsspp = new PPSSPP();

		ppsspp.onError = (message, level) => {
			console.log(message);
		};
		ppsspp.onClose = () => {
			console.log('Disconnected');
		};

		ppsspp.autoConnect().then(() => {
			console.log('Connected');
		}, err => {
			console.log('Connect failed', err);
		});
	}
}

export default App;
