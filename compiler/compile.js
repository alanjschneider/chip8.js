import { readFile } from 'node:fs/promises';
import { Lexer } from './Lexer.js';
import { Parser } from './Parser.js';

const source = await readFile('compiler/test.asm', 'utf-8');
const lexer = new Lexer();
const parser = new Parser();

const tokens = lexer.tokenize(source);
console.log(tokens);
const bin = parser.parse(tokens);
console.log(bin);

for (let i = 0; i < bin.length; i += 2) {
  const opcode = (bin[i] << 8) | bin[i + 1];
  console.log(hexString(opcode));
}

function hexString(n) {
  return '0x' + n.toString(16).padStart(4, 0);
}
