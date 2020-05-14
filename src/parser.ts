import { Token, TokenType } from './tokenizer';
import { ParseError, SourceLocation, SourceContext, assert } from './helpers';

import {
	Node,
	ExpressionNode,
	ProgramNode,
	EXPRESSION_NODE_TYPES,
	assertNodeType,
	STATEMENT_NODE_TYPES,
	NodeTypes,
	NodeOfType,
} from './nodeTypes';

export default function parser(ctx: SourceContext, tokens: Token[]) {
	let curr = 0;

	// Must be invoked with `curr` pointing to a NEW token
	const _parse = (): Node => {
		/**
		 * The current token that the parser is evaluating. This will be different from
		 * `tokens[curr]` after calls to check/expect with consume = true, because they match
		 * against `tokens[curr]` (and consequently set `token` to that on a successful match), but
		 * then update `curr` for the next call.
		 */
		let token = tokens[curr];

		const check = (type: TokenType, consume: boolean = true): boolean => {
			if (curr >= tokens.length) return false;
			if (tokens[curr].type !== type) return false;
			else if (consume) token = tokens[curr++];
			return true;
		};

		const expect = (type: TokenType, consume: boolean = true): boolean => {
			if (!check(type, consume)) {
				throw new ParseError(
					token.loc,
					`Unexpected token ${token.type}! Expected ${type}!`,
				);
			}
			return true;
		};

		if (check('identifier')) {
			let node: ExpressionNode = {
				type: 'Identifier',
				name: token.value,
				loc: token.loc,
			};

			// CallExpression
			if (check('open-paren')) {
				node = {
					type: 'CallExpression',
					name: node,
					args: [],
					loc: node.loc, // TODO: correct loc
				};

				while (
					!check('close-paren', false) &&
					(node.args.length === 0 || expect('comma'))
				) {
					const arg = parse('function-arg');

					assertNodeType(
						EXPRESSION_NODE_TYPES,
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

			if (check('semicolon')) {
				return { type: 'ExpressionStatement', loc: node.loc, expression: node };
			} else {
				return node;
			}
		}

		if (check('open-paren')) {
			const expr = parse('paren-wrapped-expression-statement');
			assertNodeType(
				EXPRESSION_NODE_TYPES,
				expr,
				new ParseError(expr.loc, `Expected an expression, got: ${expr.type}!`),
			);
			expect('close-paren');
			return {
				type: 'ExpressionStatement',
				expression: expr,
				loc: expr.loc, // FIXME: needs to include the parens
			};
		}

		if (curr >= tokens.length) {
			throw new ParseError(new SourceLocation(ctx, ctx.input.length - 1), 'Unexpected EOF!');
		} else {
			throw new ParseError(tokens[curr].loc, `Unexpected Token: ${tokens[curr].type}!`);
		}
	};

	const parse = (traceName: string): Node => {
		ctx.enter(traceName);

		const node: Node = _parse();

		ctx.exit();

		return node;
	};

	const root: ProgramNode = {
		type: 'Program',
		loc: new SourceLocation(ctx, 0, ctx.input.length - 1),
		body: [],
	};

	while (curr < tokens.length) {
		const statement = parse('root');
		assertNodeType(
			STATEMENT_NODE_TYPES,
			statement,
			new ParseError(
				statement.loc,
				`Expected a statement, got a ${statement.type}! Did you forget a semicolon?`,
			),
		);
		root.body.push(statement);
	}

	return root;
}
