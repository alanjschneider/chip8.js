export class LexerError extends Error {
  constructor(line, message) {
    super('[line ' + line + '] ' + message);
  }
}
