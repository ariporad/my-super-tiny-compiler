import tokenizer from './tokenizer';
import { SourceContext } from './helpers';
import parser from './parser';
import { formatINode, formatONode } from './debugFormatters';
import traverse from './traverser';
import visitor from './visitor';

export function compile(str: string): string {
	const ctx = new SourceContext(str);
	const tokens = tokenizer(ctx);
	const iast = parser(ctx, tokens);
	const oast = traverse(iast, visitor);
	return formatONode(oast);
}
