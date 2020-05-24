import { ONode } from './nodes/onodes';
import { INode, ProgramINode, AllINodes } from './nodes/inodes';
import { NodeType, NodeFromType } from './nodes';

export interface TraverserAPI {
	traverse<T extends INode, R extends ONode = ONode>(node: T): R;
	traverse<T extends INode, R extends ONode = ONode>(node: T[]): R[];
}

export type VisitorHandler<T extends INode, R extends ONode = ONode> = (
	t: TraverserAPI,
	node: T,
) => R;

export type Visitor = {
	[K in NodeType<AllINodes>]: VisitorHandler<NodeFromType<AllINodes, K>>;
};

export default function traverser(ast: ProgramINode, visitor: Visitor) {
	const stack: INode[] = [];

	function traverse<T extends INode, R extends ONode = ONode>(inode: T): R;
	function traverse<T extends INode, R extends ONode = ONode>(inode: T[]): R[];
	function traverse<T extends INode, R extends ONode = ONode>(inode: T | T[]): R | R[] {
		if (Array.isArray(inode)) {
			return inode.map((n) => traverse<T, R>(n));
		}

		stack.push(inode);

		// This is definately sound but Typescript can't figure it out for some reason
		// FIXME: We have no way to confirm that visitorHandler does indeed return an R
		const visitorHandler = (visitor[inode.type] as unknown) as VisitorHandler<T, R>;

		const onode = visitorHandler({ traverse }, inode);

		stack.pop();

		return onode;
	}

	return traverse(ast);
}
