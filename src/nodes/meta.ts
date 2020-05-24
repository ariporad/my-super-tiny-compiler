import { assert } from 'console';
import { assertExists } from '../helpers';
import { Node, NodeClass, NodeType } from '.';

export class NodeMeta<T extends Node> {
	readonly nodeClass: NodeClass<T>;
	readonly childrenKeys: ReadonlyArray<Exclude<keyof T, keyof Node>>;
	readonly dataKeys: ReadonlyArray<Exclude<keyof T, keyof Node>>;

	get type(): NodeType<T> {
		return (this.constructor as NodeClass<T>).TYPE;
	}

	private static _registry: Map<string, NodeMeta<any>> = new Map();

	public static register<T extends Node>(
		nodeClass: NodeClass<T>,
		childrenKeys: Exclude<keyof T, keyof Node>[],
		dataKeys: Exclude<keyof T, keyof Node>[],
	): void {
		assert(
			!this.has(nodeClass.TYPE),
			`Attempted to register the same type (${nodeClass.TYPE}) twice!`,
		);
		this._registry.set(nodeClass.TYPE, new this(nodeClass, childrenKeys, dataKeys));
	}

	public static has<T extends Node>(type: NodeType<T>): boolean {
		return this._registry.has(type);
	}

	public static get<T extends Node>(type: NodeType<T>): NodeMeta<T> {
		return assertExists(this._registry.get(type), `Couldn't find NodeMeta for type: ${type}!`);
	}

	private constructor(
		nodeClass: NodeClass<T>,
		childrenKeys: Exclude<keyof T, keyof Node>[],
		dataKeys: Exclude<keyof T, keyof Node>[],
	) {
		this.nodeClass = nodeClass;
		this.childrenKeys = childrenKeys;
		this.dataKeys = dataKeys;
	}
}
