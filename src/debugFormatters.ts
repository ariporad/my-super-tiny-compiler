import { Token } from './tokenizer';
import { INode, inodeInfos, INodeInfo, IS_INODE } from './inodeTypes';
import { indent, assert } from './helpers';
import { ONode, onodeInfos, ONodeInfo, IS_ONODE } from './onodeTypes';

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

const _formatONodes = (nodes: ONode[]): string =>
	// We join then indent because each `formatNode` output could be more than one line.
	indent(nodes.map((node) => formatONode(node)).join('\n'));

export const formatONode = (node: ONode, shortIdentifiers = false) => {
	assert(node._type === IS_ONODE, 'Found an INode in an ONode hierarchy!');
	if (shortIdentifiers && node.type === 'Identifier') {
		return `${node.name} (${node.loc.start}-${node.loc.end})`;
	}

	const info = onodeInfos[node.type] as ONodeInfo<typeof node>;
	const data: string[] = [`${node.loc.start}-${node.loc.end}`].concat(
		info.dataKeys.map((key) => `${key}: ${node[key]}`),
	);

	let output = `${node.type} (${data.join(', ')})`;

	if (info.childrenKeys.length !== 0) {
		info.childrenKeys.map((key) => {
			const formatted = Array.isArray(node[key])
				? _formatONodes(node[key])
				: '    ' + formatONode(node[key]);
			output += `\n  ${key}:\n${formatted}`;
		});
	}

	return output;
};
