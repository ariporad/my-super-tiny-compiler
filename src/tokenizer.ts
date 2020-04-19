import { ParseError } from './helpers.js';

// JS RegExes are stateful in strange ways, so it's simpler to always recreate them
const getIdentifierRegex = () => /[a-zA-Z0-9]/;
const getWhitespaceRegex = () => /\s/; // For consistency

type char = string;

interface PredicateAPI {
	peek(...matchers: Array<RegExp | char>): boolean;
	consume(): char;
}

interface ActionAPI {
	resetCurrToken(): void;

	finishToken(type: string, data?: object): void;

	readonly input: string;
	readonly tokens: Token[]; // Mutating the contents of the array is OK
	readonly pos: number;
	readonly nextStartPos: number;
	readonly currToken: string;
}

interface Predicate {
	(api: PredicateAPI): Boolean;
}

interface Action {
	(api: ActionAPI): void;
}

type Matcher = RegExp | char;

/**
 * Interface Predicate (ex. match, matchAll)
 *
 * const predicate = (args) => ({ peek, consume }) => Boolean
 *
 * peek(...matchers) => Boolean - Checks if the next char matches `matchers`
 * consume() => String - Adds the next char to the current token, increments `pos`, returns the char
 */

const match = (...matchers: Matcher[]): Predicate => ({ peek, consume }) => {
	if (peek(...matchers)) {
		consume();
		return true;
	}
	return false;
};

const matchAll = (...matchers: Matcher[]): Predicate => (api) => {
	let ret = false;
	const predicate = match(...matchers);
	while (predicate(api)) ret = true;
	return ret;
};

/**
 * Tokenizers format:
 * [predicate, action]
 *
 * predicate - a `Predicate`, as defined above.
 * action - a function invoked with { finishToken, resetCurrToken }, OR (preferred) a token type
 * 			string OR an array of arguments to finishToken
 */
const tokenizers: Array<[Predicate, string | [string, object?] | Action]> = [
	[match('(', ')'), 'paren'],
	[matchAll(getIdentifierRegex()), 'identifier'],
	[match(';'), 'semicolor'],
	[match(','), 'comma'],
	// Consume all the whitespace, then delete it
	[matchAll(getWhitespaceRegex()), ({ resetCurrToken }) => resetCurrToken()],
];

interface Position {
	readonly start: number;
	readonly end: number;
}

interface Token {
	readonly type: string;
	readonly value: string;
	readonly data: Readonly<object>;
	readonly pos: Position;
}

export default function tokenizer(input: string) {
	const tokens: Token[] = [];

	let pos = 0;
	let nextStartPos = 0;
	let currToken = '';

	const peek = (...matchers: Matcher[]): boolean => {
		let matched = false;
		for (let i = 0; !matched && i < matchers.length; i++) {
			let matcher = matchers[i];
			if (matcher instanceof RegExp) matched = matcher.test(input[pos]);
			if (typeof matcher === 'string') matched = input[pos] === matcher;
		}
		return matched;
	};

	const consume = (): char => (currToken += input[pos++]);

	const resetCurrToken = (): void => {
		currToken = '';
		nextStartPos = pos;
	};

	const finishToken = (type: string, data: object = {}) => {
		/**
		 * Register a new token. Automagically adds position information. Call this after `pos` has
		 * been fully incremented (ie. is past the end of the token).
		 */
		tokens.push({
			type,
			value: currToken,
			data,
			pos: { start: nextStartPos, end: pos - 1 },
		});
		resetCurrToken();
	};

	const predicateAPI: PredicateAPI = Object.freeze({ peek, consume });
	const actionAPI: ActionAPI = Object.freeze({
		resetCurrToken,
		finishToken,
		input,
		tokens, // `tokens` is NOT frozen
		get pos() {
			return pos;
		},
		get nextStartPos() {
			return nextStartPos;
		},
		get currToken() {
			return currToken;
		},
	});

	// It's finally happened: I've had a use for labeled loops!
	char_loop: while (pos < input.length) {
		for (let i = 0; i < tokenizers.length; i++) {
			const [predicate, action] = tokenizers[i];
			if (predicate(predicateAPI)) {
				if (typeof action === 'string') finishToken(action);
				else if (Array.isArray(action)) finishToken(...action);
				// TODO: this API should be better
				else if (typeof action === 'function') action(actionAPI);
				else throw new Error('Illegal Action!');

				continue char_loop;
			}
		}

		throw new ParseError(input, pos, `Unexpected: "${input[pos]}"`);
	}

	return tokens;
}

export const formatTokens = (tokens: Token[]) =>
	tokens
		.map((token) => {
			const { type, pos, ...data } = token;
			const startPos = `${pos.start}`.padStart(3);
			const endPos = `${pos.end}`.padStart(3);
			return `${type.padEnd(10, ' ')} (${startPos} -${endPos}): ${JSON.stringify(data)}`;
		})
		.join('\n');