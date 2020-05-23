import { assert, context, assertExists } from './helpers';

export class SourceContext {
	readonly input: string;

	private readonly id: number;
	private static _nextId: number = 0;

	constructor(input: string) {
		this.input = input;
		this.id = SourceContext._nextId++;
	}

	private _stack: string[] = [];

	get stack(): ReadonlyArray<string> {
		return this._stack;
	}

	enter(name: string) {
		this._stack.push(name);
	}

	exit() {
		this._stack.pop();
	}

	toJSON() {
		return `<SourceContext #${this.id}>`;
	}
}

export type SourceLocatable = SourceLocation | { loc: SourceLocation };

export class SourceLocation {
	readonly ctx: SourceContext;
	readonly start: number;
	readonly end: number;

	constructor(loc: SourceLocatable);
	constructor(ctx: SourceContext, start: number, end?: number);
	constructor(
		ctxOrLoc: SourceLocatable | SourceContext,
		start?: number | undefined,
		end: number | undefined = start,
	) {
		if (ctxOrLoc instanceof SourceContext) {
			this.ctx = ctxOrLoc;
			this.start = assertExists(start, 'Must pass start to new SourceLocation!');
			this.end = assertExists(end, 'Unknown Error');
		} else {
			if (!(ctxOrLoc instanceof SourceLocation)) {
				assert(
					ctxOrLoc.loc instanceof SourceLocation,
					'Must pass a SourceLocation or SourceLocatable to new SourceLocation!',
				);
				ctxOrLoc = ctxOrLoc.loc;
			}
			this.ctx = ctxOrLoc.ctx;
			this.start = ctxOrLoc.start;
			this.end = ctxOrLoc.end;
		}
	}

	/**
	 * Determine if this SourceLocation entirely contains `other`.
	 */
	contains(other: SourceLocation): boolean {
		assert(
			this.ctx === other.ctx,
			"Can't compare SourceLocations from different SourceContexts!",
		);
		return this.start <= other.start && this.end >= other.end;
	}

	/**
	 * Returns a new SourceLocation that contains all passed SourceLocations.
	 *
	 * **NOTE:** the new SourceLocation _may_ contain locations that were not covered by any of the
	 *           of the original SourceLocations. For example, the union of `A: [5, 7]` and
	 *           `B: [10, 12]` is `C: [5, 12]`. C covers 8 and 9, neither of which were covered by
	 *           A or B.
	 *
	 * @param locs the SourceLocations to merge
	 */
	static union(...locs: SourceLocation[]) {
		const ctx = locs[0].ctx;
		let start = locs[0].start;
		let end = locs[0].end;

		// `i` starts at 1 because we've already accounted for locs[0] above.
		for (let i = 1; i < locs.length; i++) {
			assert(
				locs[i].ctx === ctx,
				'Cannot union SourceLocations from different SourceContexts!',
			);

			if (locs[i].start < start) start = locs[i].start;
			if (locs[i].end > end) end = locs[i].end;
		}

		return new SourceLocation(ctx, start, end);
	}
}

export class ParseError extends Error {
	readonly loc: SourceLocation;

	constructor(loc: SourceLocatable, message: string = 'Unknown Parse Error') {
		loc = new SourceLocation(loc);

		const msg = [
			message,
			'At: ' + loc.ctx.stack.join(' -> '),
			context(loc.ctx.input, loc.start, 3),
		].join('\n\n');

		super(msg);

		this.loc = loc;

		delete this.stack; // Should we be doing this?
	}
}
