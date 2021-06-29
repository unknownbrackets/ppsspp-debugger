import { useEffect, useRef } from 'react';
import LogItem from './LogItem';
import { useLogItems } from '../utils/logger';
import './Log.css';

export default function Log(props) {
	const logItems = useLogItems();

	const divRef = useRef();

	useEffect(() => {
		const div = divRef.current;
		div.scrollTop = div.scrollHeight - div.clientHeight;
	}, [divRef, logItems]);

	return (
		<div id="Log" ref={divRef}>
			{logItems.map(item => <LogItem key={item.id} item={item} />)}
		</div>
	);
}
