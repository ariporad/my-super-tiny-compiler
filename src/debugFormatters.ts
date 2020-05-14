import { Token } from './tokenizer';
import { Node, isNode } from './nodeTypes';
import { prefixEachLine, indent } from './helpers';

/**
 * A simple helper to format a list of tokens in a human-readable format.
 */
export const formatTokens = (tokens: Token[]) =>
	tokens
		.map((token) => {
			const { type, loc, ...data } = token;
			const startPos = `${loc.start}`.padStart(3);
			const endPos = `${loc.end}`.padStart(3);
			return `${type.padEnd(10, ' ')} (${startPos} -${endPos}): ${JSON.stringify(data)}`;
		})
		.join('\n');

const _formatNodes = (nodes: Node[]): string =>
	// We join then indent because each `formatNode` output could be more than one line.
	indent(nodes.map((node) => formatNode(node)).join('\n'));

export const formatNode = (node: Node, shortIdentifiers = false) => {
	if (shortIdentifiers && node.type === 'Identifier') {
		return `${node.name} (${node.loc.start}-${node.loc.end})`;
	}

	const children: [string, Node[]][] = [];
	const keys = Object.keys(node).filter(
		(key) => !['type', 'loc'].includes(key),
	) as (keyof typeof node)[];
	let data: string[] = [`${node.loc.start}-${node.loc.end}`];

	keys.forEach((key) => {
		if (Array.isArray(node[key])) {
			children.push([key, (node[key] as unknown) as Node[]]);
		} else {
			let val = node[key] as string | Node;
			if (isNode(val)) val = formatNode(val, true);
			data.push(`${key}: ${val}`);
		}
	});

	const mainline = `${node.type} (${data.join(', ')})`;

	if (children.length === 0) return mainline;
	else if (children.length === 1) return `${mainline}\n${_formatNodes(children[0][1])}`;
	else {
		// WARNING: This code path is not yet tested
		const childrenStr = children
			.map(([name, nodes]) => `  ${name}:\n${_formatNodes(nodes)}`)
			.join('\n\n');

		return `${mainline}\n${childrenStr}`;
	}
};
