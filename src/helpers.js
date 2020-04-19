export const repeat = (num, str) => {
	let output = '';
	for (let i = 0; i < num; i++) output += str;
	return output;
};

export const context = (input, pos, numLines = 3) => {
	if (pos < 0 || pos >= input) throw new Error('Invalid Arguments!');

	if (input[input.length - 1] !== '\n') input += '\n'; // Make sure we properly handle the last line

	const lines = [];
	let currLineNum = 1;
	let currLine = '';
	let indicatorLine = null;
	let targetLineIdx = null;

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

	return lines
		.slice(
			Math.max(0, targetLineIdx - numLines),
			Math.min(lines.length, targetLineIdx + 2 /* target and indicator */ + numLines),
		)
		.join('\n');
};

export class ParseError extends Error {
	constructor(input, pos, message = 'Unknown Parse Error') {
		message = `${message}\n\n${context(input, pos, 3)}`;
		super(message);
		this.pos = pos;
		delete this.stack;
	}
}
