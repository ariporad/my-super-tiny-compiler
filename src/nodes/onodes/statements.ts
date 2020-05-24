import { NodeMeta, ExpressionONode, IdentifierONode } from '..';
import { ONode } from '.';
import { SourceLocatable } from '../../location';

export type AllStatementONodes =
	| ExpressionStatementONode
	| VariableDeclarationONode
	| VariableDeclarationStatementONode;

export abstract class StatementONode extends ONode {}

export class ExpressionStatementONode extends StatementONode {
	static readonly TYPE: 'OExpressionStatement' = 'OExpressionStatement';
	readonly type: 'OExpressionStatement' = 'OExpressionStatement';
	readonly expression: ExpressionONode;

	constructor(loc: SourceLocatable, expression: ExpressionONode) {
		super(loc);
		this.expression = expression;
	}
}

NodeMeta.register(ExpressionStatementONode, ['expression'], []);

export class VariableDeclarationONode extends ONode {
	static readonly TYPE: 'OVariableDeclaration' = 'OVariableDeclaration';
	readonly type: 'OVariableDeclaration' = 'OVariableDeclaration';

	readonly name: IdentifierONode;
	readonly value: ExpressionONode;

	constructor(loc: SourceLocatable, name: IdentifierONode, value: ExpressionONode) {
		super(loc);
		this.name = name;
		this.value = value;
	}
}

NodeMeta.register(VariableDeclarationONode, ['name', 'value'], []);

export class VariableDeclarationStatementONode extends StatementONode {
	static readonly TYPE: 'OVariableDeclarationStatement' = 'OVariableDeclarationStatement';
	readonly type: 'OVariableDeclarationStatement' = 'OVariableDeclarationStatement';

	readonly variant: 'let' | 'const' | 'var';
	readonly declarations: VariableDeclarationONode[];

	constructor(
		loc: SourceLocatable,
		variant: 'let' | 'const' | 'var',
		declarations: VariableDeclarationONode[],
	) {
		super(loc);
		this.variant = variant;
		this.declarations = declarations;
	}
}

NodeMeta.register(VariableDeclarationStatementONode, ['declarations'], ['variant']);
