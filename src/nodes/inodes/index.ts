import { NodeMeta, Node, NodeType } from '..';
import { SourceLocatable } from '../../location';

export type AllINodes = ProgramINode | IdentifierINode | CallExpressionINode;

export abstract class INode extends Node {
	abstract readonly type: NodeType<AllINodes>;
}

export abstract class ExpressionINode extends INode {}

export class ProgramINode extends INode {
	static readonly TYPE: 'IProgram' = 'IProgram';
	readonly type: 'IProgram' = 'IProgram';

	readonly body: ExpressionINode[];

	constructor(loc: SourceLocatable, body: ExpressionINode[]) {
		super(loc);
		this.body = body;
	}
}

NodeMeta.register(ProgramINode, ['body'], []);

export class IdentifierINode extends ExpressionINode {
	static readonly TYPE: 'IIdentifier' = 'IIdentifier';
	readonly type: 'IIdentifier' = 'IIdentifier';

	readonly name: string;

	constructor(loc: SourceLocatable, name: string) {
		super(loc);
		this.name = name;
	}
}

NodeMeta.register(IdentifierINode, [], ['name']);

export class CallExpressionINode extends ExpressionINode {
	static readonly TYPE: 'ICallExpression' = 'ICallExpression';
	readonly type: 'ICallExpression' = 'ICallExpression';

	readonly name: IdentifierINode;
	readonly args: ExpressionINode[];

	constructor(loc: SourceLocatable, name: IdentifierINode, args: ExpressionINode[]) {
		super(loc);
		this.name = name;
		this.args = args;
	}
}

NodeMeta.register(CallExpressionINode, ['name', 'args'], []);
