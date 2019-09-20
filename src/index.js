import React from 'react';
import ReactDOM from 'react-dom';
import Modal from 'react-modal';
import './index.css';
import App from './components/App';
import registerServiceWorker from './registerServiceWorker';
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';

ReactDOM.render(<App />, document.getElementById('root'));
Modal.setAppElement('#root');
registerServiceWorker();
