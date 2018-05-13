export function toString08X(val) {
	const hex = val.toString(16).toUpperCase();
	return ('00000000' + hex).substr(-8);
}

export function toString04X(val) {
	const hex = val.toString(16).toUpperCase();
	return ('0000' + hex).substr(-4);
}

export function toString02X(val) {
	const hex = val.toString(16).toUpperCase();
	return ('00' + hex).substr(-2);
}
