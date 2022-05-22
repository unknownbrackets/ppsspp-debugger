import React from 'react';
import { createRoot } from 'react-dom/client';
import Modal from 'react-modal';
import './index.css';
import App from './components/App';
import registerServiceWorker from './registerServiceWorker';
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';

const root = createRoot(document.getElementById('root'));
root.render(<App />);
Modal.setAppElement('#root');
registerServiceWorker();
