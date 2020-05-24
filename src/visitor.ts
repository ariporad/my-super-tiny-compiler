import { assert } from './helpers';
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
import { ProgramINode, ExpressionINode, IdentifierINode } from './nodes/inodes';
import { Visitor } from './traverser';

const visitor: Visitor = {
	IProgram({ traverse }, inode: ProgramINode): ProgramONode {
		const body = traverse<ExpressionINode, ExpressionONode | StatementONode>(inode.body).map(
			(onode) => {
				if (onode instanceof StatementONode) return onode;

				return new ExpressionStatementONode(onode, onode);
			},
		);

		return new ProgramONode(inode, body);
	},

	IIdentifier({ traverse }, inode): IdentifierONode {
		return new IdentifierONode(inode, inode.name);
	},

	ICallExpression({ traverse }, inode): ExpressionONode | VariableDeclarationStatementONode {
		switch (inode.name.name) {
			case 'STRING': {
				assert(
					inode.args.length === 1,
					`STRING(...) must have exactly one argument!`,
					inode.args[1] ||
						// Closing paren
						new SourceLocation(inode.loc.ctx, inode.loc.end - 2, inode.loc.end - 1),
				);
				const firstArg = inode.args[0];
				if (firstArg instanceof IdentifierINode) {
					return new StringONode(inode, firstArg.name);
				} else {
					return new CallExpressionONode(
						inode,
						new PropertyAccessONode(
							traverse(inode.args[0]),
							traverse(inode.args[0]),
							'toString',
						),
						[],
					);
				}
			}
			case 'NUMBER': {
				assert(
					inode.args.length === 1,
					`NUMBER(...) must have exactly one argument!`,
					inode.args[1] ||
						// Closing paren
						new SourceLocation(inode.loc.ctx, inode.loc.end - 2, inode.loc.end - 1),
				);
				const firstArg = inode.args[0];
				if (firstArg instanceof IdentifierINode) {
					const value = Number(firstArg.name);
					assert(
						!isNaN(value),
						`Illegal numerical value: "${firstArg.name}"!`,
						inode.args[0].loc,
					);
					return new NumberONode(inode, value);
				} else {
					return new CallExpressionONode(
						inode,
						new IdentifierONode(inode.name.loc, 'Number'),
						[traverse(inode.args[0])],
					);
				}
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
					inode.args[0] instanceof IdentifierINode,
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
