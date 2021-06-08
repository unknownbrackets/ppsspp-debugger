import { createContext, useContext } from 'react';
import PPSSPP from '../sdk/ppsspp.js';
import { GameStatusValues } from '../utils/game.js';

/**
 * @callback LogCallback
 * @param {string} message Message to log.
 */

/**
 * @typedef {object} DebuggerContextValues
 * @property {PPSSPP|null} ppsspp PPSSPP SDK instance.
 * @property {GameStatusValues|null} gameStatus Basic thread/stepping information.
 * @property {LogCallback} log Function to display a log message.
 */

/**
 * @type {DebuggerContextValues}
 */
const defaultContext = {
	ppsspp: null,
	gameStatus: null,
	log: (message) => console.error(message),
};

const DebuggerContext = createContext(defaultContext);
DebuggerContext.displayName = 'DebuggerContext';
export default DebuggerContext;

export function useDebuggerContext() {
	return useContext(DebuggerContext);
}

export function DebuggerProvider({ children, gameStatus, log, ppsspp }) {
	return (
		<DebuggerContext.Provider value={{ gameStatus, log, ppsspp }}>
			{children}
		</DebuggerContext.Provider>
	);
}
