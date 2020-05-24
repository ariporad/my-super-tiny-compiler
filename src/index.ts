import tokenizer from './tokenizer';
import parser from './parser';
import traverser from './traverser';
import visitor from './visitor';
import { SourceContext } from './location';
import { formatNode } from './debugFormatters';

export function compile(str: string): string {
	const ctx = new SourceContext(str);
	const tokens = tokenizer(ctx);
	const iast = parser(ctx, tokens);
	const oast = traverser(iast, visitor);
	return formatNode(oast);
}
