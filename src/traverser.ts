import { ProgramINode, INodeTypes, INode, INodeOfType } from './inodeTypes';
import { ONode } from './nodes/onodes';

export interface TraverserAPI {
	traverse<T extends INode, R extends ONode = ONode>(node: T): R;
	traverse<T extends INode, R extends ONode = ONode>(node: T[]): R[];
}

export type VisitorHandler<T extends INode, R extends ONode = ONode> = (
	t: TraverserAPI,
	node: T,
) => R;

export type Visitor = { [K in INodeTypes]: VisitorHandler<INodeOfType<K>> };

export default function traverse(ast: ProgramINode, visitor: Visitor) {
	const stack: INode[] = [];

	function _traverse<T extends INode, R extends ONode = ONode>(inode: T): R;
	function _traverse<T extends INode, R extends ONode = ONode>(inode: T[]): R[];
	function _traverse<T extends INode, R extends ONode = ONode>(inode: T | T[]): R | R[] {
		if (Array.isArray(inode)) {
			return inode.map((n) => _traverse<T, R>(n));
		}

		stack.push(inode);

		const visitorHandler = visitor[inode.type] as VisitorHandler<T, ONode>;

		// FIXME: We have no way to confirm that visitorHandler does indeed return an R
		const onode = visitorHandler({ traverse: _traverse }, inode) as R;

		stack.pop();

		return onode;
	}

	return _traverse(ast);
}
