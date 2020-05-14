import { SourceLocation, assert } from './helpers';

type _ExtractTypes<T extends Node> = T extends { type: infer U } ? U : never;

export const EXPRESSION_NODE_TYPES: ExpressionNodeTypes[] = ['CallExpression', 'Identifier'];
export const NODE_TYPES: NodeTypes[] = ['Program', ...EXPRESSION_NODE_TYPES];

export type ExpressionNodeTypes = _ExtractTypes<ExpressionNode>;
export type NodeTypes = _ExtractTypes<Node>;

export type Node = ProgramNode | ExpressionNode;
export type ExpressionNode = CallExpressionNode | IdentifierNode;

export type NodeOfType<T extends NodeTypes> = Node & { type: T } extends infer U ? U : never;

interface NodeInterface {
	type: NodeTypes;
	loc: SourceLocation;
}

export const isNode = (maybeNode: any): maybeNode is Node => {
	return typeof maybeNode.type === 'string' && NODE_TYPES.includes(maybeNode.type);
};

export interface ProgramNode extends NodeInterface {
	type: 'Program';
	body: ExpressionNode[];
}

export interface IdentifierNode extends NodeInterface {
	type: 'Identifier';
	name: string;
}

export interface CallExpressionNode extends NodeInterface {
	type: 'CallExpression';
	name: IdentifierNode;
	args: ExpressionNode[];
}

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
