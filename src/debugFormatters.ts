import { Token } from './tokenizer';
import { INode, inodeInfos, INodeInfo, IS_INODE } from './inodeTypes';
import { indent, assert } from './helpers';
import { ONode, IdentifierONode, NodeMeta, Node } from './nodes';

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

const _formatINodes = (nodes: INode[]): string =>
	// We join then indent because each `formatNode` output could be more than one line.
	indent(nodes.map((node) => formatINode(node)).join('\n'));

export const formatINode = (node: INode, shortIdentifiers = false) => {
	assert(node._type === IS_INODE, 'Found an ONode in an INode hierarchy!');
	if (shortIdentifiers && node.type === 'Identifier') {
		return `${node.name} (${node.loc.start}-${node.loc.end})`;
	}

	const info = inodeInfos[node.type] as INodeInfo<typeof node>;
	const data: string[] = [`${node.loc.start}-${node.loc.end}`].concat(
		info.dataKeys.map((key) => `${key}: ${node[key]}`),
	);

	let output = `${node.type} (${data.join(', ')})`;

	if (info.childrenKeys.length !== 0) {
		info.childrenKeys.map((key) => {
			const formatted = Array.isArray(node[key])
				? _formatINodes(node[key])
				: '    ' + formatINode(node[key]);
			output += `\n  ${key}:\n${formatted}`;
		});
	}

	return output;
};

const _formatNodes = (nodes: Node[]): string =>
	// We join then indent because each `formatNode` output could be more than one line.
	indent(nodes.map((node) => formatNode(node)).join('\n'));

export const formatNode = (node: Node, shortIdentifiers = false) => {
	if (shortIdentifiers && node instanceof IdentifierONode) {
		return `${node.name} (${node.loc.start}-${node.loc.end})`;
	}

	const meta = NodeMeta.get<typeof node>(node.type);

	const data: string[] = [`${node.loc.start}-${node.loc.end}`].concat(
		meta.dataKeys.map((key) => `${key}: ${node[key]}`),
	);

	let output = `${node.type} (${data.join(', ')})`;

	meta.childrenKeys.forEach((key) => {
		const formatted = Array.isArray(node[key])
			? _formatNodes(node[key])
			: '    ' + formatNode(node[key]);
		output += `\n  ${key}:\n${formatted}`;
	});

	return output;
};
