import { readFileSync } from 'fs';
import { resolve } from 'path';
import { compile } from './index.js';
import { indent } from './helpers.js';
import { runInNewContext } from 'vm';
import { inspect } from 'util';

const examples = readFileSync(resolve(__dirname, '..', 'examples.txt'), 'utf8').split('\n---\n');

// Clear the console
process.stdout.write('\u001B[2J\u001B[0;0f');

class FakeConsole {
	_stdout = '';
	_stderr = '';

	private _format(args: (string | any)[]): string {
		return args.map((arg) => (typeof arg === 'string' ? arg : inspect(arg))).join(' ');
	}

	log(...args: (string | any)[]) {
		this._stdout += this._format(args);
	}

	error(...args: (string | any)[]) {
		this._stderr += this._format(args);
	}
}

examples
	.map((example) => example.trim())
	.forEach((example, i) => {
		console.log('\nINPUT:\n');
		console.log(indent(example));
		try {
			const code = compile(example);
			console.log('\nOUTPUT:\n');
			console.log(indent(code));
			const fakeConsole = new FakeConsole();
			runInNewContext(
				code,
				{
					console: fakeConsole,
				},
				{ filename: `example-${i}.tx` },
			);
			console.log('\nSTDOUT:\n');
			console.log(indent(fakeConsole._stdout || 'None'));
			console.log('\nSTDERR:\n');
			console.log(indent(fakeConsole._stderr || 'None'));
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
