import { readFileSync } from 'fs';
import { resolve } from 'path';
import { compile } from './index.js';
import { indent } from './helpers.js';

const examples = readFileSync(resolve(__dirname, '..', 'examples.txt'), 'utf8').split('\n---\n');

// Clear the console
process.stdout.write('\u001B[2J\u001B[0;0f');

examples
	.map((example) => example.trim())
	.forEach((example) => {
		console.log('\nINPUT:\n');
		console.log(indent(example));
		try {
			const output = compile(example);
			console.log('\nOUTPUT:\n');
			console.log(indent(output));
			console.log('\n');
		} catch (err) {
			console.log('\nERROR:\n');
			console.log(indent(err.message));
			err.stack && console.log(indent(err.stack));
			console.log('\n');
		}
		console.log(
			'--------------------------------------------------------------------------------',
		);
	});

console.log('\nOK!');
