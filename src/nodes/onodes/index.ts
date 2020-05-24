import { NodeMeta, Node, StatementONode, NodeType } from '..';
import { SourceLocatable } from '../../location';
import { AllExpressionONodes } from './expressions';
import { AllStatementONodes } from './statements';

export type AllONodes = ProgramONode | AllExpressionONodes | AllStatementONodes;

export abstract class ONode extends Node {
	abstract readonly type: NodeType<AllONodes>;

	abstract codegen(): string;
}

export class ProgramONode extends ONode {
	static readonly TYPE: 'OProgram' = 'OProgram';
	readonly type: 'OProgram' = 'OProgram';
	readonly body: StatementONode[];

	constructor(loc: SourceLocatable, body: StatementONode[]) {
		super(loc);
		this.body = body;
	}

	codegen(): string {
		return this.body.map((node) => node.codegen()).join('\n\n');
	}
}

NodeMeta.register(ProgramONode, ['body'], []);

export * from './expressions';
export * from './statements';
