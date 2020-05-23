import { SourceLocatable, SourceLocation } from '../location';
import { NodeMeta } from './meta';

export type NodeType = string;
export type NodeTypeString<T extends Node> = T extends { type: infer U } ? U : never;

export interface NodeClass<T extends Node = Node> {
	new (...args: any[]): T;

	readonly TYPE: NodeTypeString<T>;
}

export abstract class Node {
	abstract readonly type: NodeType;
	readonly loc: SourceLocation;

	constructor(loc: SourceLocatable) {
		this.loc = new SourceLocation(loc);
	}
}

export * from './onodes';
export { NodeMeta };
