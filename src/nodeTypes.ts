import { SourceLocation, assert } from './helpers';

/**
 * Helper Types
 */

type _ExtractTypes<T extends Node> = T extends { type: infer U } ? U : never;

export type NodeOfType<T extends NodeTypes> = Node & { type: T } extends infer U ? U : never;
export type TypeOfNode<T extends NodeInterface> = T extends { type: infer U } ? U : never;

/**
 * Node Types
 */
export const EXPRESSION_NODE_TYPES: ExpressionNodeTypes[] = ['CallExpression', 'Identifier'];
export type ExpressionNodeTypes = _ExtractTypes<ExpressionNode>;
export type ExpressionNode = CallExpressionNode | IdentifierNode;

export const NODE_TYPES: NodeTypes[] = ['Program', ...EXPRESSION_NODE_TYPES];
export type NodeTypes = _ExtractTypes<Node>;
export type Node = ProgramNode | ExpressionNode;

/**
 * NodeInfo & Friends
 */

export interface NodeInfo<T extends NodeInterface> {
	readonly type: TypeOfNode<T>;

	/**
	 * Keys that include other Node_s.
	 */
	readonly childrenKeys: Exclude<keyof T, keyof NodeInterface>[];

	/**
	 * Keys that do not include other Node_s.
	 */
	readonly dataKeys: Exclude<keyof T, keyof NodeInterface>[];
}

const nodeInfo: {
	[T in NodeTypes]?: NodeInfo<any>;
} = {};

export function getNodeInfo<T extends NodeInterface>(type: TypeOfNode<T>): NodeInfo<T> {
	return nodeInfo[type] as NodeInfo<T>;
}

function addNodeInfo<T extends NodeInterface>(info: NodeInfo<T>) {
	nodeInfo[info.type] = info;
}

/**
 * Node Definitions
 */

interface NodeInterface {
	readonly type: NodeTypes;
	loc: SourceLocation;
}

export interface ProgramNode extends NodeInterface {
	type: 'Program';
	body: ExpressionNode[];
}

addNodeInfo<ProgramNode>({
	type: 'Program',
	childrenKeys: ['body'],
	dataKeys: [],
});

export interface IdentifierNode extends NodeInterface {
	type: 'Identifier';
	name: string;
}

addNodeInfo<IdentifierNode>({
	type: 'Identifier',
	childrenKeys: [],
	dataKeys: ['name'],
});

export interface CallExpressionNode extends NodeInterface {
	type: 'CallExpression';
	name: IdentifierNode;
	args: ExpressionNode[];
}

addNodeInfo<CallExpressionNode>({
	type: 'CallExpression',
	childrenKeys: ['args', 'name'],
	dataKeys: [],
});

/**
 * Helpers
 */

export const isNode = (maybeNode: any): maybeNode is Node => {
	return typeof maybeNode.type === 'string' && NODE_TYPES.includes(maybeNode.type);
};

export function checkNodeType<T extends NodeTypes>(
	types: T | T[],
	node: Node,
): node is NodeOfType<T> {
	return makeCheckNodeType(types)(node);
}

export function makeCheckNodeType<T extends NodeTypes>(
	types: T | T[],
): (node: Node) => node is NodeOfType<T> {
	if (!Array.isArray(types)) types = [types];
	return function checkType(node: Node): node is NodeOfType<T> {
		return (types as string[]).includes(node.type);
	};
}

export function assertNodeType<T extends NodeTypes>(
	types: T | T[],
	node: Node,
): asserts node is NodeOfType<T>;

export function assertNodeType<T extends NodeTypes>(
	types: T | T[],
	node: Node,
	message: string,
): asserts node is NodeOfType<T>;

export function assertNodeType<T extends NodeTypes>(
	types: T | T[],
	node: Node,
	error: Error,
): asserts node is NodeOfType<T>;

export function assertNodeType<T extends NodeTypes>(
	types: T | T[],
	node: Node,
	errorOrMessage?: Error | string,
): asserts node is NodeOfType<T>;

export function assertNodeType<T extends NodeTypes>(
	types: T | T[],
	node: Node,
	errorOrMessage?: Error | string,
): asserts node is NodeOfType<T> {
	assert(checkNodeType(types, node), errorOrMessage);
}
