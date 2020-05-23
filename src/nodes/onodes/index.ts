import { NodeMeta, Node, StatementONode } from '..';
import { SourceLocatable } from '../../location';

export abstract class ONode extends Node {}

export class ProgramONode extends ONode {
	static readonly TYPE: 'Program' = 'Program';
	readonly type: 'Program' = 'Program';
	readonly body: StatementONode[];

	constructor(loc: SourceLocatable, body: StatementONode[]) {
		super(loc);
		this.body = body;
	}
}

NodeMeta.register(ProgramONode, ['body'], []);

export * from './expressions';
export * from './statements';
