import { Visitor } from './traverser';
import { assert } from './helpers';
import { ExpressionINode } from './inodeTypes';
import {
	ProgramONode,
	ExpressionONode,
	StatementONode,
	ExpressionStatementONode,
	IdentifierONode,
	VariableDeclarationStatementONode,
	CallExpressionONode,
	PropertyAccessONode,
	StringONode,
	NumberONode,
	VariableDeclarationONode,
} from './nodes';
import { SourceLocation } from './location';

const visitor: Visitor = {
	Program({ traverse }, inode): ProgramONode {
		const body = traverse<ExpressionINode, ExpressionONode | StatementONode>(inode.body).map(
			(onode) => {
				if (onode instanceof StatementONode) return onode;

				return new ExpressionStatementONode(onode, onode);
			},
		);

		return new ProgramONode(inode, body);
	},

	Identifier({ traverse }, inode): IdentifierONode {
		return new IdentifierONode(inode, inode.name);
	},

	CallExpression({ traverse }, inode): ExpressionONode | VariableDeclarationStatementONode {
		switch (inode.name.name) {
			case 'STRING':
				assert(
					inode.args.length === 1,
					`STRING(...) must have exactly one argument!`,
					inode.args[1]?.loc ||
						// Closing paren
						new SourceLocation(inode.loc.ctx, inode.loc.end - 2, inode.loc.end - 1),
				);
				if (inode.args[0].type !== 'Identifier') {
					return new CallExpressionONode(
						inode,
						new PropertyAccessONode(inode.args[0], inode.args[0], 'toString'),
						[],
					);
				} else {
					return new StringONode(inode.loc, inode.args[0].name);
				}
			case 'NUMBER':
				assert(
					inode.args.length === 1,
					`NUMBER(...) must have exactly one argument!`,
					inode.args[1] ||
						// Closing paren
						new SourceLocation(inode.loc.ctx, inode.loc.end - 2, inode.loc.end - 1),
				);
				if (inode.args[0].type !== 'Identifier') {
					return new CallExpressionONode(
						inode,
						new IdentifierONode(inode.name.loc, 'Number'),
						[traverse(inode.args[0])],
					);
				} else {
					const value = Number(inode.args[0].name);
					assert(
						!isNaN(value),
						`Illegal numerical value: "${inode.args[0].name}"!`,
						inode.args[0].loc,
					);
					return new NumberONode(inode, value);
				}
			case 'DEFINE':
				assert(
					inode.args.length === 2,
					`DEFINE(...) must have exactly two arguments!`,
					inode.args[2] ||
						// Closing paren
						new SourceLocation(inode.loc.ctx, inode.loc.end - 2, inode.loc.end - 1),
				);
				assert(
					inode.args[0].type === 'Identifier',
					`The first argument to DEFINE(...) must be an identifier!`,
					inode.args[0],
				);
				return new VariableDeclarationStatementONode(inode, 'let', [
					new VariableDeclarationONode(
						inode,
						traverse(inode.args[0]),
						traverse(inode.args[1]),
					),
				]);
			default:
				return new CallExpressionONode(
					inode.loc,
					traverse(inode.name),
					traverse(inode.args),
				);
		}
	},
};

export default visitor;
