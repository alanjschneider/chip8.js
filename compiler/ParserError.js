export class ParserError extends Error {
  constructor(line, message) {
    super('[line ' + line + '] ' + message);
  }
}
