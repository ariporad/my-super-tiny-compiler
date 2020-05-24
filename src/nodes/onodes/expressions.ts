import { ONode } from '.';
import { NodeMeta } from '..';
import { SourceLocatable } from '../../location';

export type AllExpressionONodes =
	| IdentifierONode
	| PropertyAccessONode
	| CallExpressionONode
	| StringONode
	| NumberONode;

export abstract class ExpressionONode extends ONode {}
export abstract class ReferenceONode extends ExpressionONode {}

export class IdentifierONode extends ReferenceONode {
	static readonly TYPE: 'OIdentifier' = 'OIdentifier';
	readonly type: 'OIdentifier' = 'OIdentifier';

	readonly name: string;

	constructor(loc: SourceLocatable, name: string) {
		super(loc);
		this.name = name;
	}
}

NodeMeta.register(IdentifierONode, [], ['name']);

export class PropertyAccessONode extends ReferenceONode {
	static readonly TYPE: 'OPropertyAccess' = 'OPropertyAccess';
	readonly type: 'OPropertyAccess' = 'OPropertyAccess';

	readonly obj: ExpressionONode;
	readonly key: string | number;

	constructor(loc: SourceLocatable, obj: ExpressionONode, key: string | number) {
		super(loc);
		this.obj = obj;
		this.key = key;
	}
}

NodeMeta.register(PropertyAccessONode, ['obj'], ['key']);

export class CallExpressionONode extends ExpressionONode {
	static readonly TYPE: 'OCallExpression' = 'OCallExpression';
	readonly type: 'OCallExpression' = 'OCallExpression';

	readonly callee: ReferenceONode;
	readonly args: ExpressionONode[];

	constructor(loc: SourceLocatable, callee: ReferenceONode, args: ExpressionONode[]) {
		super(loc);
		this.callee = callee;
		this.args = args;
	}
}

NodeMeta.register(CallExpressionONode, ['callee', 'args'], []);

export class StringONode extends ExpressionONode {
	static readonly TYPE: 'OString' = 'OString';
	readonly type: 'OString' = 'OString';

	readonly value: string;

	constructor(loc: SourceLocatable, value: string) {
		super(loc);
		this.value = value;
	}
}

NodeMeta.register(StringONode, [], ['value']);

export class NumberONode extends ExpressionONode {
	static readonly TYPE: 'ONumber' = 'ONumber';
	readonly type: 'ONumber' = 'ONumber';

	readonly value: number;

	constructor(loc: SourceLocatable, value: number) {
		super(loc);
		this.value = value;
	}
}

NodeMeta.register(NumberONode, [], ['value']);
