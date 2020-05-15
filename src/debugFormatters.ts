import { Token } from './tokenizer';
import { Node, getNodeInfo } from './nodeTypes';
import { indent } from './helpers';

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

	const info = getNodeInfo<typeof node>(node.type);
	const data: string[] = [`${node.loc.start}-${node.loc.end}`].concat(
		info.dataKeys.map((key) => `${key}: ${node[key]}`),
	);

	let output = `${node.type} (${data.join(', ')})`;

	if (info.childrenKeys.length !== 0) {
		info.childrenKeys.map((key) => {
			const formatted = Array.isArray(node[key])
				? _formatNodes(node[key])
				: '    ' + formatNode(node[key]);
			output += `\n  ${key}:\n${formatted}`;
		});
	}

	return output;
};
