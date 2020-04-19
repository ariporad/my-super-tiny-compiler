import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { compile } from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const examples = readFileSync(resolve(__dirname, 'examples.txt'), 'utf8').split('\n---\n');

const indent = (str) => '\t' + str.split('\n').join('\n\t');

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
			console.log(indent(err.stack || err.message));
			console.log('\n');
		}
		console.log(
			'--------------------------------------------------------------------------------',
		);
	});

console.log('\nOK!');
