import tokenizer, { formatTokens } from './tokenizer.js';

export function compile(str: string): string {
	return formatTokens(tokenizer(str));
}
