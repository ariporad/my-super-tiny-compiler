import { Visitor } from './traverser';
import {
	ProgramONode,
	IS_ONODE,
	IdentifierONode,
	VariableDeclarationStatementONode,
	ExpressionONode,
	EXPRESSION_ONODE_TYPES,
	ExpressionONodeTypes,
	STATEMENT_ONODE_TYPES,
	StatementONode,
	StatementONodeTypes,
	ExpressionStatementONode,
	assertONodeType,
	checkONodeType,
} from './onodeTypes';
import { assert, SourceLocation } from './helpers';
import { ExpressionINode } from './inodeTypes';

const visitor: Visitor = {
	Program({ traverse }, inode): ProgramONode {
		const body = traverse<ExpressionINode, ExpressionONode | StatementONode>(inode.body).map(
			(onode) => {
				if (checkONodeType(STATEMENT_ONODE_TYPES, onode)) return onode;
				return {
					_type: IS_ONODE,
					type: 'ExpressionStatement',
					expression: onode,
					loc: onode.loc,
				} as ExpressionStatementONode;
			},
		);
		return {
			_type: IS_ONODE,
			type: 'Program',
			body,
			loc: inode.loc,
		};
	},

	Identifier({ traverse }, inode): IdentifierONode {
		return {
			_type: IS_ONODE,
			type: 'Identifier',
			loc: inode.loc,
			name: inode.name,
		};
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
					return {
						_type: IS_ONODE,
						type: 'CallExpression',
						target: {
							_type: IS_ONODE,
							type: 'PropertyAccess',
							obj: traverse(inode.args[0]),
							name: 'toString',
							loc: inode.args[0].loc,
						},
						loc: inode.loc,
						args: [],
					};
				} else {
					return {
						_type: IS_ONODE,
						type: 'String',
						value: inode.args[0].name,
						loc: inode.loc,
					};
				}
			case 'NUMBER':
				assert(
					inode.args.length === 1,
					`NUMBER(...) must have exactly one argument!`,
					inode.args[1]?.loc ||
						// Closing paren
						new SourceLocation(inode.loc.ctx, inode.loc.end - 2, inode.loc.end - 1),
				);
				if (inode.args[0].type !== 'Identifier') {
					return {
						_type: IS_ONODE,
						type: 'CallExpression',
						target: {
							_type: IS_ONODE,
							type: 'Identifier',
							name: 'Number',
							loc: inode.name.loc,
						},
						args: [traverse(inode.args[0])],
						loc: inode.loc,
					};
				} else {
					const value = Number(inode.args[0].name);
					assert(
						!isNaN(value),
						`Illegal numerical value: "${inode.args[0].name}"!`,
						inode.args[0].loc,
					);
					return {
						_type: IS_ONODE,
						type: 'Number',
						value: Number(inode.args[0].name),
						loc: inode.loc,
					};
				}
			case 'DEFINE':
				assert(
					inode.args.length === 2,
					`DEFINE(...) must have exactly two arguments!`,
					inode.args[2]?.loc ||
						// Closing paren
						new SourceLocation(inode.loc.ctx, inode.loc.end - 2, inode.loc.end - 1),
				);
				assert(
					inode.args[0].type === 'Identifier',
					`The first argument to DEFINE(...) must be an identifier!`,
					inode.args[0].loc,
				);
				return {
					_type: IS_ONODE,
					type: 'VariableDeclarationStatement',
					variant: 'let',
					declarations: [
						{
							_type: IS_ONODE,
							type: 'VariableDeclaration',
							name: traverse(inode.args[0]),
							value: traverse(inode.args[1]),
							loc: inode.loc,
						},
					],
					loc: inode.loc,
				};
			default:
				return {
					_type: IS_ONODE,
					type: 'CallExpression',
					target: traverse(inode.name),
					args: traverse(inode.args),
					loc: inode.loc,
				};
		}
	},
};

export default visitor;
