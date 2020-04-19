import tokenizer, { formatTokens } from './tokenizer.js';

export function compile(str) {
	return formatTokens(tokenizer(str));
}
