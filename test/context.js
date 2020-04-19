import { context } from '../src/helpers.js';

const testContext = (pos, lines) => {
	console.log(`@${pos} (${lines})`);
	console.log(
		context(
			`
012345678
012345678
012345678
012345678
012345678
012345678
012345678
012345678
012345678
012345678
`.trim(),
			pos,
			lines,
		),
	);
};

testContext(45, 3);
