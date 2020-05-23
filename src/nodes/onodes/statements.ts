import { NodeMeta, ExpressionONode, IdentifierONode } from '..';
import { ONode } from '.';
import { SourceLocatable } from '../../location';

export abstract class StatementONode extends ONode {}

export class ExpressionStatementONode extends StatementONode {
	static readonly TYPE: 'ExpressionStatement' = 'ExpressionStatement';
	readonly type: 'ExpressionStatement' = 'ExpressionStatement';
	readonly expression: ExpressionONode;

	constructor(loc: SourceLocatable, expression: ExpressionONode) {
		super(loc);
		this.expression = expression;
	}
}

NodeMeta.register(ExpressionStatementONode, ['expression'], []);

export class VariableDeclarationONode extends ONode {
	static readonly TYPE: 'VariableDeclaration' = 'VariableDeclaration';
	readonly type: 'VariableDeclaration' = 'VariableDeclaration';

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
	static readonly TYPE: 'VariableDeclarationStatement' = 'VariableDeclarationStatement';
	readonly type: 'VariableDeclarationStatement' = 'VariableDeclarationStatement';

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
