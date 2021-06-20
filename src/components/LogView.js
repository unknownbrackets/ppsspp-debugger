import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './Log.css';
import LogItem from './LogItem';

export default function LogView(props) {
	const { logHistory } = props;

	const divRef = useRef();

	useEffect(() => {
		const div = divRef.current;
		div.scrollTop = div.scrollHeight - div.clientHeight;
	}, [divRef, logHistory]);

	return (
		<div id="Log" ref={divRef}>
			{logHistory?.items.map(item => <LogItem key={item.id} item={item} />)}
		</div>
	);
}

LogView.propTypes = {
	logHistory: PropTypes.object
};
