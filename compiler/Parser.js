import { ParserError } from './ParserError.js';
import { TokenType } from './Token.js';

export class Parser {
  constructor() {
    this.cursor = 0;
    this.tokens = [];
  }

  peek() {
    return this.tokens[this.cursor];
  }

  advance() {
    return this.tokens[this.cursor++];
  }

  lookBehind() {
    return this.tokens[this.cursor - 1];
  }

  lookAhead() {
    return this.tokens[this.cursor + 1];
  }

  isAtEnd() {
    this.cursor >= this.tokens.length;
  }

  expect(type, message) {
    if (!this.match(type)) {
      throw new ParserError(this.peek().line, message);
    }
  }

  matchAny(...types) {
    if (this.isAtEnd()) return false;
    for (const type of types) {
      if (this.peek().type === type) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  match(type) {
    if (this.isAtEnd()) return false;
    if (this.peek().type !== type) return false;
    this.advance();
    return true;
  }

  matchRegister() {
    return this.matchAny(
      TokenType.V0,
      TokenType.V1,
      TokenType.V2,
      TokenType.V3,
      TokenType.V4,
      TokenType.V5,
      TokenType.V6,
      TokenType.V7,
      TokenType.V8,
      TokenType.V9,
      TokenType.VA,
      TokenType.VB,
      TokenType.VC,
      TokenType.VD,
      TokenType.VE,
      TokenType.VF,
    );
  }

  matchNumber() {
    return this.matchAny(TokenType.DECIMAL, TokenType.HEX, TokenType.BIN);
  }

  parseNumber(token) {
    if (token.type === TokenType.DECIMAL) {
      return parseInt(token.lexeme);
    }
    if (token.type === TokenType.HEX) {
      return parseInt(token.lexeme.slice(2), 16);
    }
    if (token.type === TokenType.BIN) {
      return parseInt(token.lexeme.slice(2), 2);
    }
  }

  add() {
    if (this.matchRegister()) {
      const x = parseInt(this.lookBehind().lexeme[1], 16);
      this.expect(TokenType.COMMA, "Expected ','.");
      if (this.matchRegister()) {
        const y = parseInt(this.lookBehind().lexeme[1], 16);
        const h = (0x8 << 4) | x;
        const l = (y << 4) | 0x4;
        return [h, l];
      } else if (this.matchNumber()) {
        const byte = this.parseNumber(this.lookBehind());
        const h = (0x7 << 4) | x;
        const l = byte;
        return [h, l];
      }
    } else if (this.match(TokenType.I)) {
      this.expect(TokenType.COMMA, "Expected ','.");
      if (this.matchRegister()) {
        const x = parseInt(this.lookBehind().lexeme[1], 16);
        const h = (0xf << 4) | x;
        const l = 0x1e;
        return [h, l];
      }
    }
  }

  sub(n = false) {
    if (this.matchRegister()) {
      const x = parseInt(this.lookBehind().lexeme[1], 16);
      this.expect(TokenType.COMMA, "Expected ','.");
      if (this.matchRegister()) {
        const y = parseInt(this.lookBehind().lexeme[1], 16);
        const h = (0x8 << 4) | x;
        const l = (y << 4) | (n ? 0x7 : 0x5);
        return [h, l];
      }
    }
  }

  cls() {
    return [0x00, 0xe0];
  }

  ret() {
    return [0x00, 0xee];
  }

  jp() {
    if (!this.matchNumber()) {
      throw new ParserError(this.peek().line, 'Expected number.');
    }
    const addr = parseInt(this.lookBehind().lexeme, 16);
    if (addr > 0xfff) {
      throw new ParserError(
        this.peek().line,
        'Memory address out of range (0-4095).',
      );
    }
    const h = (0x1 << 4) | (addr >> 8);
    const l = addr & 0xff;
    return [h, l];
  }

  call() {
    if (!this.matchNumber()) {
      throw new ParserError(this.peek().line, 'Expected number.');
    }
    const addr = parseInt(this.lookBehind().lexeme, 16);
    if (addr > 0xfff) {
      throw new ParserError(
        this.peek().line,
        'Memory address out of range (0-4095).',
      );
    }
    const h = (0x2 << 4) | (addr >> 8);
    const l = addr & 0xff;
    return [h, l];
  }

  se(n = false) {
    if (this.matchRegister()) {
      const x = parseInt(this.lookBehind().lexeme[1], 16);
      this.expect(TokenType.COMMA, "Expected ','.");
      if (this.matchRegister()) {
        const y = parseInt(this.lookBehind().lexeme[1], 16);
        const h = ((n ? 0x9 : 0x5) << 4) | x;
        const l = (y << 4) | 0x0;
        return [h, l];
      } else if (this.matchNumber()) {
        const byte = this.parseNumber(this.lookBehind());
        const h = ((n ? 0x4 : 0x3) << 4) | x;
        const l = byte;
        return [h, l];
      }
    }
  }

  ld() {
    if (this.matchRegister()) {
      const x = parseInt(this.lookBehind().lexeme[1], 16);
      this.expect(TokenType.COMMA, "Expected ','.");
      if (this.matchRegister()) {
        const y = parseInt(this.lookBehind().lexeme[1], 16);
        const h = (0x8 << 4) | x;
        const l = (y << 4) | 0x4;
        return [h, l];
      } else if (this.matchNumber()) {
        const byte = this.parseNumber(this.lookBehind());
        const h = (0x6 << 4) | x;
        const l = byte;
        return [h, l];
      }
    } else if (this.match(TokenType.I)) {
      this.expect(TokenType.COMMA, "Expected ','.");
      if (this.matchRegister()) {
        const x = parseInt(this.lookBehind().lexeme[1], 16);
        const h = (0xf << 4) | x;
        const l = 0x1e;
        return [h, l];
      }
    }
  }

  line() {
    if (this.match(TokenType.ADD)) {
      return this.add();
    } else if (this.match(TokenType.SUB)) {
      return this.sub();
    } else if (this.match(TokenType.SUBN)) {
      return this.sub(true);
    } else if (this.match(TokenType.CLS)) {
      return this.cls();
    } else if (this.match(TokenType.RET)) {
      return this.ret();
    } else if (this.match(TokenType.JP)) {
      return this.jp();
    } else if (this.match(TokenType.CALL)) {
      return this.call();
    } else if (this.match(TokenType.SE)) {
      return this.se();
    } else if (this.match(TokenType.SNE)) {
      return this.se(true);
    } else if (this.match(TokenType.LD)) {
      return this.ld();
    }
  }

  program() {
    const lines = [];
    while (!this.match(TokenType.EOF)) {
      lines.push(...this.line());
    }
    return lines;
  }

  parse(tokens) {
    this.cursor = 0;
    this.tokens = tokens;

    return this.program();
  }
}
