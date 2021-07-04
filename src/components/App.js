import { Component } from 'react';
import { BrowserRouter as Router, NavLink, Route, Switch } from 'react-router-dom';
import CPU from './CPU';
import GPU from './GPU';
import { DebuggerProvider } from './DebuggerContext';
import NotConnected from './NotConnected';
import PPSSPP from '../sdk/ppsspp.js';
import listeners from '../utils/listeners.js';
import logger from '../utils/logger.js';
import GameStatus from '../utils/game.js';
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
		gameStatus: null,
	};
	gameStatus;
	ppsspp;
	originalTitle;

	constructor(props) {
		super(props);

		this.ppsspp = new PPSSPP();
		this.gameStatus = new GameStatus();
		this.originalTitle = document.title;

		listeners.init(this.ppsspp);
		listeners.listen({
			'connection.change': this.onConnectionChange,
			'game.start': this.updateTitle,
			'game.quit': this.updateTitle,
		});
		logger.init(this.ppsspp);
		this.gameStatus.init(this.ppsspp);
		this.gameStatus.listenState(gameStatus => {
			this.setState({ gameStatus });
		});
	}

	render() {
		return (
			<Router>
				<DebuggerProvider gameStatus={this.state.gameStatus} log={this.log} ppsspp={this.ppsspp}>
					<div className="App">
						<header className="App-header">
							<ul className="App-nav">
								<NavLink to="/cpu" isActive={(m, l) => m || l.pathname === '/'}>CPU</NavLink>
								<NavLink to="/gpu">GPU</NavLink>
							</ul>
							<img src={logo} className="App-logo" alt="PPSSPP" />
							<h1 className="App-title">Debugger</h1>
						</header>
						{this.renderContent()}
					</div>
				</DebuggerProvider>
			</Router>
		);
	}

	renderContent() {
		if (!this.state.connected) {
			return <NotConnected connecting={this.state.connecting} connect={this.connect} />;
		}

		return (
			<Switch>
				<Route path="/gpu">
					<GPU />
				</Route>
				<Route>
					<CPU />
				</Route>
			</Switch>
		);
	}

	componentDidMount() {
		// Connect automatically on start.
		if (!this.props.testing) {
			this.handleAutoConnect();
		}
	}

	handleAutoConnect = () => {
		this.connect(null);
	}

	connect = (uri) => {
		this.setState({ connecting: true });

		this.ppsspp.onClose = () => {
			this.log('Debugger disconnected');
			listeners.change(false);
			this.setState({ connected: false, connecting: false });
		};

		let connection;
		if (uri === null) {
			connection = this.ppsspp.autoConnect();
		} else {
			connection = this.ppsspp.connect(uri);
		}

		connection.then(() => {
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
		// Would rather keep Logger managing its state, and pass this callback around.
		logger.addLogItem({ message: message + '\n' });
	}

	updateTitle = (data) => {
		if (!document) {
			return;
		}

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
