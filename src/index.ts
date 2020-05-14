import tokenizer, { formatTokens } from './tokenizer';
import { SourceContext } from './helpers';
import parser from './parser';

export function compile(str: string): string {
	const ctx = new SourceContext(str);
	const tokens = tokenizer(ctx);
	const ast = parser(ctx, tokens);
	return JSON.stringify(ast, null, 4);
}
