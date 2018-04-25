export function ensureInView(node, options) {
	const rect = node.getBoundingClientRect();
	if (rect.top < 0 || rect.left < 0) {
		node.scrollIntoView(options);
		return true;
	}
	if (rect.bottom >= window.innerHeight || rect.right >= window.innerWidth) {
		node.scrollIntoView(options);
		return true;
	}
	return false;
}
