import { SourceLocation, assert } from './helpers';
import { INodeTypes, INodeOfType } from './inodeTypes';

/**
 * Helper Types
 */

type _ExtractOTypes<T extends ONode> = T extends { type: infer U } ? U : never;

export type TypeOfONode<T extends ONodeInterface> = T extends { type: infer U } ? U : never;
export type ONodeOfType<T extends ONodeTypes> = ONode extends infer U
	? U extends { type: T }
		? U
		: never
	: never;

/**
 * ONode Types
 */
export const REFERENCE_ONODE_TYPES: ReferenceONodeTypes[] = ['Identifier', 'PropertyAccess'];
export type ReferenceONodeTypes = _ExtractOTypes<ReferenceONode>;
export type ReferenceONode = IdentifierONode | PropertyAccessONode;

export const STATEMENT_ONODE_TYPES: StatementONodeTypes[] = [
	'VariableDeclarationStatement',
	'ExpressionStatement',
];
export type StatementONodeTypes = _ExtractOTypes<StatementONode>;
export type StatementONode = VariableDeclarationStatementONode | ExpressionStatementONode;

export const EXPRESSION_ONODE_TYPES: ExpressionONodeTypes[] = [
	'CallExpression',
	'String',
	'Number',
	...REFERENCE_ONODE_TYPES,
];
export type ExpressionONodeTypes = _ExtractOTypes<ExpressionONode>;
export type ExpressionONode = CallExpressionONode | ReferenceONode | StringONode | NumberONode;

export const NODE_TYPES: ONodeTypes[] = [
	'Program',
	'VariableDeclaration', // Not sure where this should go
	...EXPRESSION_ONODE_TYPES,
	...STATEMENT_ONODE_TYPES,
];
export type ONodeTypes = _ExtractOTypes<ONode>;
export type ONode = ProgramONode | ExpressionONode | StatementONode | VariableDeclarationONode;

/**
 * ONodeInfo & Friends
 */

export interface ONodeInfo<T extends ONodeInterface> {
	readonly type: TypeOfONode<T>;

	/**
	 * Keys that include other Node_s.
	 */
	readonly childrenKeys: Exclude<keyof T, keyof ONodeInterface>[];

	/**
	 * Keys that do not include other Node_s.
	 */
	readonly dataKeys: Exclude<keyof T, keyof ONodeInterface>[];
}

export const onodeInfos: {
	[T in ONodeTypes]?: ONodeInfo<ONodeOfType<T>>;
} = {};

/**
 * Node Definitions
 */

export const IS_ONODE = Symbol('IS_ONODE');

interface ONodeInterface {
	readonly _type: typeof IS_ONODE;
	readonly type: ONodeTypes;
	loc: SourceLocation;
}

// Prefer ONode
// Use this only in very limited circumstances, for example:
//     `type Foo<T extends ONode> = { [K in Exclude<keyof T, keyof ONodeInterface>]: ... })`
export type _ONodeInterface = ONodeInterface;

export interface ProgramONode extends ONodeInterface {
	type: 'Program';
	body: StatementONode[];
}

onodeInfos.Program = {
	type: 'Program',
	childrenKeys: ['body'],
	dataKeys: [],
};

export interface IdentifierONode extends ONodeInterface {
	type: 'Identifier';
	name: string;
}

onodeInfos.Identifier = {
	type: 'Identifier',
	childrenKeys: [],
	dataKeys: ['name'],
};

export interface PropertyAccessONode extends ONodeInterface {
	type: 'PropertyAccess';
	obj: ExpressionONode;
	name: string | number;
}

onodeInfos.PropertyAccess = {
	type: 'PropertyAccess',
	childrenKeys: ['obj'],
	dataKeys: ['name'],
};

export interface CallExpressionONode extends ONodeInterface {
	type: 'CallExpression';
	target: ReferenceONode;
	args: ExpressionONode[];
}

onodeInfos.CallExpression = {
	type: 'CallExpression',
	childrenKeys: ['args', 'target'],
	dataKeys: [],
};

export interface StringONode extends ONodeInterface {
	type: 'String';
	value: string;
}

onodeInfos.String = {
	type: 'String',
	childrenKeys: [],
	dataKeys: ['value'],
};

export interface NumberONode extends ONodeInterface {
	type: 'Number';
	value: number;
}

onodeInfos.Number = {
	type: 'Number',
	childrenKeys: [],
	dataKeys: ['value'],
};

export interface VariableDeclarationONode extends ONodeInterface {
	type: 'VariableDeclaration';
	name: IdentifierONode;
	value: ExpressionONode;
}

onodeInfos.VariableDeclaration = {
	type: 'VariableDeclaration',
	childrenKeys: ['name', 'value'],
	dataKeys: [],
};

export interface VariableDeclarationStatementONode extends ONodeInterface {
	type: 'VariableDeclarationStatement';
	variant: 'let' | 'const' | 'var';
	declarations: VariableDeclarationONode[];
}

onodeInfos.VariableDeclarationStatement = {
	type: 'VariableDeclarationStatement',
	childrenKeys: ['declarations'],
	dataKeys: ['variant'],
};

export interface ExpressionStatementONode extends ONodeInterface {
	type: 'ExpressionStatement';
	expression: ExpressionONode;
}

onodeInfos.ExpressionStatement = {
	type: 'ExpressionStatement',
	childrenKeys: ['expression'],
	dataKeys: [],
};

/**
 * Helpers
 */

export const isONode = (maybeNode: any): maybeNode is ONode =>
	typeof maybeNode.type === 'string' &&
	maybeNode._type === IS_ONODE &&
	NODE_TYPES.includes(maybeNode.type);

export function checkONodeType<T extends ONodeTypes>(
	types: T | T[],
	onode: ONode,
): onode is ONodeOfType<T> {
	return makeCheckONodeType(types)(onode);
}

export function makeCheckONodeType<T extends ONodeTypes>(
	types: T | T[],
): (onode: ONode) => onode is ONodeOfType<T> {
	if (!Array.isArray(types)) types = [types];
	return function checkType(onode: ONode): onode is ONodeOfType<T> {
		return onode._type === IS_ONODE && (types as string[]).includes(onode.type);
	};
}

export function assertONodeType<T extends ONodeTypes>(
	types: T | T[],
	onode: ONode,
): asserts onode is ONodeOfType<T>;

export function assertONodeType<T extends ONodeTypes>(
	types: T | T[],
	onode: ONode,
	message: string,
): asserts onode is ONodeOfType<T>;

export function assertONodeType<T extends ONodeTypes>(
	types: T | T[],
	onode: ONode,
	error: Error,
): asserts onode is ONodeOfType<T>;

export function assertONodeType<T extends ONodeTypes>(
	types: T | T[],
	onode: ONode,
	errorOrMessage?: Error | string,
): asserts onode is ONodeOfType<T>;

export function assertONodeType<T extends ONodeTypes>(
	types: T | T[],
	onode: ONode,
	errorOrMessage?: Error | string,
): asserts onode is ONodeOfType<T> {
	assert(checkONodeType(types, onode), errorOrMessage, onode.loc);
}
