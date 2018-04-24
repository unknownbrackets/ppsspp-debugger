export function toString08X(val) {
	const hex = val.toString(16).toUpperCase();
	return ('00000000' + hex).substr(-8);
}
