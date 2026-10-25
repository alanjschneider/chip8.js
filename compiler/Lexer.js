import { LexerError } from './LexerError.js';
import { Token, TokenType, keywords, spaces, single } from './Token.js';

export class Lexer {
  constructor() {
    this.source = null;
    this.tokens = [];
    this.cursor = 0;
    this.line = 1;
    this.column = 0;
    this.start = 0;
  }

  isAtEnd() {
    return this.cursor >= this.source.length;
  }

  advance() {
    if (this.peek() === '\n') {
      this.line++;
      this.column = 0;
    }
    return this.source[this.cursor++];
  }

  peek() {
    if (this.isAtEnd()) return '\0';
    return this.source[this.cursor];
  }

  match(lexeme) {
    if (this.isAtEnd()) return false;
    if (this.peek() !== lexeme) return false;
    this.advance();
    return true;
  }

  addToken(type) {
    const lexeme = this.source.slice(this.start, this.cursor);
    this.tokens.push(
      new Token(
        type,
        lexeme,
        this.line,
        this.column,
        this.column + lexeme.length,
      ),
    );
    this.column += lexeme.length - 1;
  }

  number() {
    if (this.peek() === 'x') {
      do this.advance();
      while (this.isHex(this.peek()));
      this.addToken(TokenType.HEX);
    } else if (this.peek() === 'b') {
      do this.advance();
      while (this.isBin(this.peek()));
      this.addToken(TokenType.BIN);
    } else {
      while (this.isDigit(this.peek())) this.advance();
      this.addToken(TokenType.DECIMAL);
    }
  }

  identifier() {
    while (this.isAlphanum(this.peek())) this.advance();
    const id = this.source.slice(this.start, this.cursor);
    if (keywords.has(id)) {
      this.addToken(keywords.get(id));
    } else {
      this.addToken(TokenType.IDENTIFIER);
    }
  }

  string(closing) {
    while (!this.isAtEnd() && this.peek() !== '\n' && this.peek() !== closing) {
      this.advance();
    }
    if (!this.match(closing)) {
      this.error(this.line, 'Unterminated string.');
    }
    this.addToken(TokenType.STRING);
  }

  tokenize(source) {
    this.source = source;
    this.tokens = [];
    this.cursor = 0;
    this.line = 1;
    this.column = 0;

    while (!this.isAtEnd()) {
      this.start = this.cursor;
      const char = this.advance();

      if (spaces.has(char)) {
        if (char !== '\n') this.column++;
        continue;
      } else if (single.has(char)) {
        this.addToken(single.get(char));
      } else {
        switch (char) {
          case '-':
            if (this.match('-')) {
              while (this.peek() !== '\n') this.advance();
            } else {
              this.addToken(TokenType.MINUS);
            }
            break;
          case '~':
            if (this.match('=')) {
              this.addToken(TokenType.TILDE_EQ);
            } else {
              this.addToken(TokenType.TILDE);
            }
            break;
          case ':':
            if (this.match('=')) {
              this.addToken(TokenType.COLON_EQ);
            } else {
              this.addToken(TokenType.COLON);
            }
            break;
          case '=':
            if (this.match('=')) {
              this.addToken(TokenType.EQ_EQ);
            } else {
              this.addToken(TokenType.EQ);
            }
            break;
          case '>':
            if (this.match('=')) {
              this.addToken(TokenType.GE);
            } else {
              this.addToken(TokenType.GT);
            }
            break;
          case '<':
            if (this.match('=')) {
              this.addToken(TokenType.LE);
            } else {
              this.addToken(TokenType.LT);
            }
            break;
          case '"':
          case "'":
            this.string(char);
            break;
          default:
            if (this.isDigit(char)) {
              this.number();
            } else if (this.isAlpha(char)) {
              this.identifier();
            } else {
              this.error(this.line, 'Unexpected token ' + char);
            }
            break;
        }
      }
      this.column++;
    }

    this.tokens.push(
      new Token(TokenType.EOF, '\0', this.line, this.column, this.column + 1),
    );

    return this.tokens;
  }

  error(line, message) {
    throw new LexerError(line, message);
  }

  isDigit(char) {
    return /[0-9]/.test(char);
  }

  isAlpha(char) {
    return /[A-Za-z_]/.test(char);
  }

  isAlphanum(char) {
    return /[A-Za-z_0-9]/.test(char);
  }

  isHex(char) {
    return /[A-Fa-f_0-9]/.test(char);
  }

  isBin(char) {
    return /[01]/.test(char);
  }
}
