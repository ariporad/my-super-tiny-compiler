import { ParseError, char, SourceContext, SourceLocation } from './helpers';

// JS RegExes are stateful in strange ways, so it's simpler to always recreate them
const getIdentifierRegex = () => /[a-z_A-Z0-9]/;
const getWhitespaceRegex = () => /\s/; // For consistency

type Criterion = RegExp | char;

/**
 * The interface given to predicates.
 *
 * @see Predicate
 */
interface PredicateAPI {
	/**
	 * Check if the next char of the input matches the any of the criteria.
	 *
	 * @param criteria one or more critera to match the next char against
	 */
	peek(...criteria: Criterion[]): boolean;

	/**
	 * Destructively consume the next char of the input and advance the pointer.
	 *
	 * @returns the char
	 */
	consume(): char;
}

/**
 * The interface given to `Action`s.
 *
 * TODO: Would this be simpler if tokenizer was aclass that we could just pass around?
 *
 * @see Action
 */
interface ActionAPI {
	/**
	 * Destructively reset the current token state. If you can at all help it, DO NOT USE this
	 * method directly. Instead, use `finishToken`.
	 *
	 * This includes:
	 * - Deletes any pending values
	 * - Updates the start location of the next token to the current position
	 *
	 * @see finishToken
	 */
	resetCurrToken(): void;

	/**
	 * Finish the current token, add it to the list, and reset state for the next token.
	 *
	 * @param type the type of the current token
	 * @param data any auxiliary data to be attached to the token
	 */
	finishToken(type: TokenType, data?: object): void;

	/**
	 * Get a source location corresponding to the current token.
	 *
	 * @see nextStartPos
	 * @see pos
	 */
	getCurrLoc(): SourceLocation;

	/**
	 * The entire input string
	 */
	readonly input: string;

	/**
	 * The list of already-extracted tokens.
	 *
	 * You may edit the contents of this array directly, but using `finishToken` is prefered to
	 * ensure all tokens are in the proper format.
	 */
	readonly tokens: Token[];

	/**
	 * The current position of the tokenizer in the input.
	 *
	 * Range is integers in (0, input.length]
	 */
	pos: number;

	/**
	 * The starting position of the current token.
	 *
	 * This value is updated at the end of every token by `finishToken`.
	 *
	 * Range is integers in (0, pos).
	 */
	nextStartPos: number;

	/**
	 * The text of the current token.
	 */
	currToken: string;
}

/**
 * A function which evaluates if the current char of the tokenizer is the start of a token, and if
 * so, consumes the entire token.
 */
interface Predicate {
	(api: PredicateAPI): Boolean;
}

/**
 * A function which takes the pending token, finalizes it, and adds it to the token list.
 */
interface Action {
	(api: ActionAPI): void;
}

/**
 * Returns a predicate that consumes the next (single) char of the input if it matches `criteria`.
 *
 * If you want this to match more than one char, @see matchAll
 *
 * @param criteria a list of criteria to match, in the same format as `peek`.
 */
const match = (...criteria: Criterion[]): Predicate => ({ peek, consume }) => {
	if (peek(...criteria)) {
		consume();
		return true;
	}
	return false;
};

/**
 * Returns a predicate that consumes an unlimited number of (consecutive) chars of the input that
 * match `criteria`.
 *
 * Basically, `match` but for more than one char. @see match
 *
 * @param criteria a list of criteria to match, in the same format as `peek`.
 */
const matchAll = (...criteria: Criterion[]): Predicate => (api) => {
	let ret = false;
	const predicate = match(...criteria);
	while (predicate(api)) ret = true;
	return ret;
};

/**
 * The meat of the tokenizer: the criteria and the token types.
 *
 * Each 2nd-order array includes a predicate and an action. When the predicate matches and consumes
 * chars, the action is invoked. For flexibility, either can just be a plain function.
 *
 * If action is a string, `finishToken` will be invoked with it. If action is an array,
 * it will be used as the arguments to `finishToken`.
 */
const tokenizers: Array<[Predicate, TokenType | [TokenType, object?] | Action]> = [
	[match('('), 'open-paren'],
	[match(')'), 'close-paren'],
	[matchAll(getIdentifierRegex()), 'identifier'],
	[match(';'), 'semicolon'],
	[match(','), 'comma'],
	// Consume all the whitespace, then delete it
	[matchAll(getWhitespaceRegex()), ({ resetCurrToken }) => resetCurrToken()],
];

/**
 * All possible token types.
 */
export type TokenType = 'identifier' | 'open-paren' | 'close-paren' | 'semicolon' | 'comma';

/**
 * A single token of the input. This represents the smallest semantically-significant unit of input.
 */
export interface Token {
	/**
	 * A string enum representing the type of token.
	 */
	readonly type: TokenType;

	/**
	 * The raw text of the token, as found in the input.
	 */
	readonly value: string;

	/**
	 * Arbitrary data associated with this token.
	 *
	 * TODO: do we really need this anymore?
	 */
	readonly data: Readonly<object>;

	/**
	 * The position of this token within the source file.
	 */
	readonly loc: SourceLocation;
}

/**
 * Tokenize `input`
 *
 * @param input the source to tokenize
 */
export default function tokenizer(ctx: SourceContext) {
	const tokens: Token[] = [];

	const input = ctx.input; // for convenience

	let pos = 0;
	let nextStartPos = 0;
	let currToken = '';

	const getCurrLoc = (): SourceLocation => new SourceLocation(ctx, nextStartPos, pos - 1);

	/**
	 * @see PredicateAPI.peek
	 */
	const peek = (...matchers: Criterion[]): boolean => {
		let matched = false;
		for (let i = 0; !matched && i < matchers.length; i++) {
			let matcher = matchers[i];
			if (matcher instanceof RegExp) matched = matcher.test(input[pos]);
			if (typeof matcher === 'string') matched = input[pos] === matcher;
		}
		return matched;
	};

	/**
	 * @see PredicateAPI.consume
	 */
	const consume = (): char => (currToken += input[pos++]);

	/**
	 * @see ActionAPI.resetCurrToken
	 */
	const resetCurrToken = (): void => {
		currToken = '';
		nextStartPos = pos;
	};

	/**
	 * @see ActionAPI.finishToken
	 */
	const finishToken = (type: TokenType, data: object = {}) => {
		/**
		 * Register a new token. Automagically adds position information. Call this after `pos` has
		 * been fully incremented (ie. is past the end of the token).
		 */
		tokens.push({
			type,
			value: currToken,
			data,
			loc: getCurrLoc(),
		});
		resetCurrToken();
	};

	const predicateAPI: PredicateAPI = Object.freeze({ peek, consume });
	const actionAPI: ActionAPI = Object.freeze({
		resetCurrToken,
		finishToken,
		getCurrLoc,
		input,
		tokens, // `tokens` is NOT frozen
		get pos() {
			return pos;
		},
		set pos(newPos) {
			pos = newPos;
		},
		get nextStartPos() {
			return nextStartPos;
		},
		set nextStartPos(newStartPos) {
			nextStartPos = newStartPos;
		},
		get currToken() {
			return currToken;
		},
		set currToken(newCurrToken) {
			currToken = newCurrToken;
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

		throw new ParseError(getCurrLoc(), `Unexpected: "${input[pos]}"`);
	}

	return tokens;
}

/**
 * A simple helper to format a list of tokens in a human-readable format.
 */
export const formatTokens = (tokens: Token[]) =>
	tokens
		.map((token) => {
			const { type, loc, ...data } = token;
			const startPos = `${loc.start}`.padStart(3);
			const endPos = `${loc.end}`.padStart(3);
			return `${type.padEnd(10, ' ')} (${startPos} -${endPos}): ${JSON.stringify(data)}`;
		})
		.join('\n');
