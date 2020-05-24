import { SourceLocatable, SourceLocation } from '../location';
import { NodeMeta } from './meta';
import { AllINodes } from './inodes';
import { AllONodes } from './onodes';

export type AllNodes = AllINodes | AllONodes;

export type NodeType<T extends Node> = T extends { type: infer U } ? U : never;
export type NodeFromType<C extends AllINodes | AllONodes, T extends NodeType<C>> = C extends infer U
	? U extends { type: T }
		? U
		: never
	: never;

export interface NodeClass<T extends Node = Node> {
	new (...args: any[]): T;

	readonly TYPE: NodeType<T>;
}

export abstract class Node {
	abstract readonly type: NodeType<AllNodes>;
	readonly loc: SourceLocation;

	constructor(loc: SourceLocatable) {
		this.loc = new SourceLocation(loc);
	}
}

export * from './inodes';
export * from './onodes';
export { NodeMeta };
