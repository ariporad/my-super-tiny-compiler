import { promises as fs } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { test } from 'tap';
import { compile } from '../src';

const __dirname = dirname(fileURLToPath(import.meta.url));

if (false) {
	test('snapshots', async (t) => {
		const files = await fs.readdir(resolve(__dirname, 'snapshots'));
		const inputs = files.filter((file) => file.endsWith('.input'));

		for (let i = 0; i < inputs.length; i++) {
			const input = await fs.readFile(inputs[i], 'utf8');
			const name = inputs[i].replace(/\.input$/, '');
			const expected = await fs.readFile(`${name}.expected`, 'utf8');

			t.test(`snapshot: ${name}`, (tt) => {
				const actual = compile(input);
				tt.equal(actual.trim(), expected.trim());
			});
		}
	});
}
