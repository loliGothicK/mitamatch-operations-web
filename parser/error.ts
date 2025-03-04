import { left } from 'fp-ts/Either';

export type ParserError = {
  path: string;
  target: string;
  msg: string;
};

export const fmtErr = (errors: ParserError[]): string => {
  return JSON.stringify(errors, null, 2);
};

export class CallPath {
  private readonly stack: string[] = [];

  constructor(stack: string[] = []) {
    this.stack = stack;
  }

  join(path: string) {
    return new CallPath([...this.stack, path]);
  }

  toString() {
    return this.stack.join('.');
  }

  static empty = new CallPath();
}

export const anyhow = <T = never>(
  path: CallPath,
  target: string,
  msg: string,
) => {
  return left<ParserError, T>({
    path: path.toString(),
    target,
    msg,
  });
};
