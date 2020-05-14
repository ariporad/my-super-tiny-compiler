export type char = string;

class AssertionError extends Error {}

export type { AssertionError };

export function assert(condition: boolean): asserts condition;
export function assert(condition: boolean, error: Error): asserts condition;
export function assert(condition: boolean, message: string): asserts condition;
export function assert(condition: boolean, errorOrMessage?: Error | string): asserts condition;
export function assert(condition: boolean, errorOrMessage?: Error | string): asserts condition {
	if (condition) return;

	// Otherwise, throw...
	if (errorOrMessage === undefined) errorOrMessage = 'Assertion Failed!';
	if (typeof errorOrMessage === 'string') throw new AssertionError(errorOrMessage);
	throw errorOrMessage;
}

export const repeat = (num: number, str: string): string => {
	let output = '';
	for (let i = 0; i < num; i++) output += str;
	return output;
};

export const context = (input: string, pos: number, numLines: number = 3): string => {
	assert(
		pos >= 0 && pos < input.length,
		`Invalid Arguments! pos: ${pos}, input.length: ${input.length}`,
	);

	if (input[input.length - 1] !== '\n') input += '\n'; // Make sure we properly handle the last line

	const lines: string[] = [];
	let currLineNum: number = 1;
	let currLine: string = '';
	let indicatorLine: string | null = null;
	let targetLineIdx: number | null = null;

	for (let i = 0; i < input.length; i++) {
		if (pos === i) {
			indicatorLine = repeat(5 /* line num length */ + currLine.length, ' ') + '^';
			targetLineIdx = lines.length;
		}
		if (input[i] === '\n') {
			lines.push(`${`${currLineNum++}`.padStart(3, ' ')}: ${currLine}`);
			if (indicatorLine !== null) {
				lines.push(indicatorLine);
				indicatorLine = null;
			}
			currLine = '';
		} else {
			currLine += input[i];
		}
	}

	if (targetLineIdx === null) throw new Error('This should be impossible!');

	return lines
		.slice(
			Math.max(0, targetLineIdx - numLines),
			Math.min(lines.length, targetLineIdx + 2 /* target and indicator */ + numLines),
		)
		.join('\n');
};

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

export class SourceLocation {
	readonly ctx: SourceContext;
	readonly start: number;
	readonly end: number;

	constructor(ctx: SourceContext, start: number, end: number = start) {
		this.ctx = ctx;
		this.start = start;
		this.end = end;
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

	constructor(loc: SourceLocation, message: string = 'Unknown Parse Error') {
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

export const prefixEachLine = (str: string, prefix: string): string =>
	prefix + str.split('\n').join('\n' + prefix);

export const indent = (text: string, amount: string = '    '): string =>
	prefixEachLine(text, amount);
