import { SourceLocatable, ParseError } from './location';

export type char = string;

class AssertionError extends Error {}

export type { AssertionError };

export function assert(condition: boolean): asserts condition;
export function assert(condition: boolean, error: Error): asserts condition;
export function assert(condition: boolean, message: string): asserts condition;
export function assert(
	condition: boolean,
	message: string,
	loc: SourceLocatable,
): asserts condition;
export function assert(
	condition: boolean,
	errorOrMessage: Error | string | undefined,
	loc?: SourceLocatable,
): asserts condition;
export function assert(
	condition: boolean,
	errorOrMessage?: Error | string,
	loc?: SourceLocatable,
): asserts condition {
	if (condition) return;

	// Otherwise, throw...
	if (errorOrMessage === undefined) errorOrMessage = 'Assertion Failed!';
	if (typeof errorOrMessage === 'string') {
		// FIXME: loc is ignored if you pass an error.
		if (loc) throw new ParseError(loc, errorOrMessage);
		else throw new AssertionError(errorOrMessage);
	}
	throw errorOrMessage;
}

export function assertExists<T>(thing: T | null | undefined, message: string): T;
export function assertExists<T>(thing: T | null | undefined, error: Error): T;
export function assertExists<T>(thing: T | null | undefined, errorOrMessage: Error | string): T;
export function assertExists<T>(thing: T | null | undefined, errorOrMessage: Error | string): T {
	assert(thing !== null && thing !== undefined, errorOrMessage);
	return thing;
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

export const prefixEachLine = (str: string, prefix: string): string =>
	prefix + str.split('\n').join('\n' + prefix);

export const indent = (text: string, amount: string = '    '): string =>
	prefixEachLine(text, amount);
