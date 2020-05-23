import { assert } from './helpers';
import { SourceLocatable, SourceLocation } from './location';

/**
 * Helper Types
 */

type _ExtractITypes<T extends INode> = T extends { type: infer U } ? U : never;

export type TypeOfINode<T extends INodeInterface> = T extends { type: infer U } ? U : never;
export type INodeOfType<T extends INodeTypes> = INode extends infer U
	? U extends { type: T }
		? U
		: never
	: never;

/**
 * INode Types
 */
export const EXPRESSION_INODE_TYPES: ExpressionINodeTypes[] = ['CallExpression', 'Identifier'];
export type ExpressionINodeTypes = _ExtractITypes<ExpressionINode>;
export type ExpressionINode = CallExpressionINode | IdentifierINode;

export const NODE_TYPES: INodeTypes[] = ['Program', ...EXPRESSION_INODE_TYPES];
export type INodeTypes = _ExtractITypes<INode>;
export type INode = ProgramINode | ExpressionINode;

/**
 * INodeInfo & Friends
 */

export interface INodeInfo<T extends INodeInterface> {
	readonly type: TypeOfINode<T>;

	/**
	 * Keys that include other Node_s.
	 */
	readonly childrenKeys: Exclude<keyof T, keyof INodeInterface>[];

	/**
	 * Keys that do not include other Node_s.
	 */
	readonly dataKeys: Exclude<keyof T, keyof INodeInterface>[];
}

export const inodeInfos: {
	[T in INodeTypes]?: INodeInfo<INodeOfType<T>>;
} = {};

/**
 * Node Definitions
 */

export const IS_INODE = Symbol('IS_INODE');

interface INodeInterface {
	readonly _type: typeof IS_INODE;
	readonly type: INodeTypes;
	loc: SourceLocation;
}

// Prefer INode
// Use this only in very limited circumstances, for example:
//     `type Foo<T extends INode> = { [K in Exclude<keyof T, keyof INodeInterface>]: ... })`
export type _INodeInterface = INodeInterface;

export interface ProgramINode extends INodeInterface {
	type: 'Program';
	body: ExpressionINode[];
}

inodeInfos.Program = {
	type: 'Program',
	childrenKeys: ['body'],
	dataKeys: [],
};

export interface IdentifierINode extends INodeInterface {
	type: 'Identifier';
	name: string;
}

inodeInfos.Identifier = {
	type: 'Identifier',
	childrenKeys: [],
	dataKeys: ['name'],
};

export interface CallExpressionINode extends INodeInterface {
	type: 'CallExpression';
	name: IdentifierINode;
	args: ExpressionINode[];
}

inodeInfos.CallExpression = {
	type: 'CallExpression',
	childrenKeys: ['args', 'name'],
	dataKeys: [],
};

/**
 * Helpers
 */

export const isINode = (maybeNode: any): maybeNode is INode =>
	typeof maybeNode.type === 'string' &&
	maybeNode._type === IS_INODE &&
	NODE_TYPES.includes(maybeNode.type);

export function checkINodeType<T extends INodeTypes>(
	types: T | T[],
	inode: INode,
): inode is INodeOfType<T> {
	return makeCheckINodeType(types)(inode);
}

export function makeCheckINodeType<T extends INodeTypes>(
	types: T | T[],
): (inode: INode) => inode is INodeOfType<T> {
	if (!Array.isArray(types)) types = [types];
	return function checkType(inode: INode): inode is INodeOfType<T> {
		return inode._type === IS_INODE && (types as string[]).includes(inode.type);
	};
}

export function assertINodeType<T extends INodeTypes>(
	types: T | T[],
	inode: INode,
): asserts inode is INodeOfType<T>;

export function assertINodeType<T extends INodeTypes>(
	types: T | T[],
	inode: INode,
	message: string,
): asserts inode is INodeOfType<T>;

export function assertINodeType<T extends INodeTypes>(
	types: T | T[],
	inode: INode,
	error: Error,
): asserts inode is INodeOfType<T>;

export function assertINodeType<T extends INodeTypes>(
	types: T | T[],
	inode: INode,
	errorOrMessage?: Error | string,
): asserts inode is INodeOfType<T>;

export function assertINodeType<T extends INodeTypes>(
	types: T | T[],
	inode: INode,
	errorOrMessage?: Error | string,
): asserts inode is INodeOfType<T> {
	assert(checkINodeType(types, inode), errorOrMessage, inode.loc);
}
