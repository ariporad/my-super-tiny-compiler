import { Token, TokenType } from './tokenizer';
import {
	ExpressionINode,
	ProgramINode,
	EXPRESSION_INODE_TYPES,
	assertINodeType,
	IS_INODE,
} from './inodeTypes';
import { SourceContext, ParseError, SourceLocation } from './location';

interface ParserInterface {
	check(type: TokenType, consume?: boolean, ignoreNewlines?: boolean): boolean;

	expect(type: TokenType, consume?: boolean, ignoreNewlines?: boolean): boolean;

	parse(traceName: string): ExpressionINode;

	getToken(): Token;
}

class Parser implements ParserInterface {
	private curr = 0;

	readonly ctx: SourceContext;

	readonly tokens: Token[];

	/**
	 * The current token that the parser is evaluating. This will be different from
	 * `tokens[curr]` after calls to check/expect with consume = true, because they match
	 * against `tokens[curr]` (and consequently set `token` to that on a successful match), but
	 * then update `curr` for the next call.
	 */
	private token: Token;

	constructor(ctx: SourceContext, tokens: Token[]) {
		this.ctx = ctx;
		this.tokens = tokens;
		this.token = tokens[0];
	}

	getToken = (): Token => {
		return this.token;
	};

	check = (type: TokenType, consume: boolean = true, ignoreNewlines = true): boolean => {
		if (this.curr >= this.tokens.length) return false;
		if (this.tokens[this.curr].type !== type) {
			if (ignoreNewlines && this.check('newline', true, false)) {
				return this.check(type, consume, ignoreNewlines);
			}
			return false;
		}
		if (consume) this.token = this.tokens[this.curr++];
		return true;
	};

	expect = (type: TokenType, consume: boolean = true, ignoreNewlines = true): boolean => {
		if (!this.check(type, consume, ignoreNewlines)) {
			throw new ParseError(
				this.token.loc,
				`Unexpected token ${this.token.type}! Expected ${type}!`,
			);
		}
		return true;
	};

	parse = (traceName: string): ExpressionINode => {
		this.ctx.enter(traceName);

		const startCurr = this.curr;

		const node = parse(this);

		if (node === null) {
			if (this.curr >= this.tokens.length) {
				throw new ParseError(
					new SourceLocation(this.ctx, this.ctx.input.length - 1),
					'Unexpected EOF!',
				);
			} else {
				throw new ParseError(
					this.tokens[this.curr].loc,
					`Unexpected Token: ${this.tokens[this.curr].type}!`,
				);
			}
		}

		node.loc = SourceLocation.union(
			...this.tokens.slice(startCurr, this.curr).map((token) => token.loc),
		);

		this.ctx.exit();

		return node;
	};

	run = (): ProgramINode => {
		const root: ProgramINode = {
			_type: IS_INODE,
			type: 'Program',
			loc: new SourceLocation(this.ctx, 0, this.ctx.input.length - 1),
			body: [],
		};

		while (this.curr < this.tokens.length) {
			root.body.push(this.parse('root'));

			// Semicolons serve to separate expressions. That means their tokens cause `check`s to
			// fail inside parse, but can be freely discarded if we're between expressions anyways.
			this.check('semicolon');
		}

		return root;
	};
}

function parse({ getToken, parse, expect, check }: ParserInterface): ExpressionINode | null {
	// Handle any expression wrapped in parens
	if (check('open-paren')) {
		const expr = parse('paren-wrapped-expression');

		assertINodeType(
			EXPRESSION_INODE_TYPES,
			expr,
			new ParseError(expr.loc, `Expected an expression, got: ${expr.type}!`),
		);

		expect('close-paren');

		return expr;
	}

	// Identifier
	if (check('identifier')) {
		let node: ExpressionINode = {
			_type: IS_INODE,
			type: 'Identifier',
			name: getToken().value,
			loc: getToken().loc,
		};

		// CallExpression
		if (check('open-paren', true, false)) {
			node = {
				_type: IS_INODE,
				type: 'CallExpression',
				name: node,
				args: [],
				loc: node.loc,
			};

			// Arguments
			while (!check('close-paren', false) && (node.args.length === 0 || expect('comma'))) {
				const arg = parse('function-arg');

				assertINodeType(
					EXPRESSION_INODE_TYPES,
					arg,
					new ParseError(
						arg.loc,
						`Expected an expression as a function argument! Got: ${arg.type}!`,
					),
				);

				node.args.push(arg);
			}

			expect('close-paren');
		}

		return node;
	}

	return null;
}

export default function (ctx: SourceContext, tokens: Token[]): ProgramINode {
	return new Parser(ctx, tokens).run();
}
