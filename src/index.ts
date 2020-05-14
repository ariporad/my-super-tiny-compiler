import tokenizer from './tokenizer';
import { SourceContext } from './helpers';
import parser from './parser';
import { formatNode } from './debugFormatters';

export function compile(str: string): string {
	const ctx = new SourceContext(str);
	const tokens = tokenizer(ctx);
	const ast = parser(ctx, tokens);
	return formatNode(ast);
}
