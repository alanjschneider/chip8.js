function makeEnum(name, values, { start = 1, indent = 2 } = {}) {
  const spaces = ' '.repeat(indent);
  let num = start;
  let str = 'export const ' + name + ' = {\n';

  for (const value of values) {
    if (value === '') {
      str += '\n';
    } else if (value.startsWith('#')) {
      str += spaces + '//' + value.slice(1) + '\n';
    } else {
      str += spaces + value + ': ' + num + ',\n';
      num++;
    }
  }
  return str + '};';
}

const tokens = [
  'LPAREN',
  'RPAREN',
  'LSQUAR',
  'RSQUAR',
  'LCURL',
  'RCURL',
  'CARET',
  'COMMA',
  'DOT',
  'MODULO',
  'MINUS',
  'PLUS',
  'SLASH',
  'STAR',
  '',
  '# One or two character tokens.',
  'TILDE',
  'TILDE_EQ',
  'COLON',
  'COLON_EQ',
  'EQ_EQ',
  'GT',
  'GE',
  'LT',
  'LE',
  '',
  '# Literals.',
  'IDENTIFIER',
  'STRING',
  'DECIMAL',
  'HEX',
  'BIN',
  '',
  '# Keywords.',
  'CLS',
  'RET',
  'JP',
  'CALL',
  'SE',
  'SNE',
  'LD',
  'ADD',
  'OR',
  'AND',
  'XOR',
  'SUB',
  'SHR',
  'SUBN',
  'SHL',
  'I',
  'RND',
  'DRW',
  'SKP',
  'SKNP',
  'DT',
  'ST',
  'V0',
  'V1',
  'V2',
  'V3',
  'V4',
  'V5',
  'V6',
  'V7',
  'V8',
  'V9',
  'VA',
  'VB',
  'VC',
  'VD',
  'VE',
  'VF',
  'KEY0',
  'KEY1',
  'KEY2',
  'KEY3',
  'KEY4',
  'KEY5',
  'KEY6',
  'KEY7',
  'KEY8',
  'KEY9',
  'KEYA',
  'KEYB',
  'KEYC',
  'KEYD',
  'KEYE',
  'KEYF',
  '',
  'EOF',
];

console.log(makeEnum('TokenType', tokens));
// console.log(makeEnum('OpCode', opCodes));
