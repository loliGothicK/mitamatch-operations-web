import { left } from "fp-ts/Either";

export type MitamaError = {
  target: string;
  msg: string;
  meta?: {
    path: string;
    memoriaName?: string;
  };
};

export const fmtErr = (errors: MitamaError[]): string => {
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
    return this.stack.join(".");
  }

  static empty = new CallPath();
}

export const anyhow = <T = never>(
  target: string,
  msg: string,
  meta?: { path: CallPath; memoriaName?: string },
) => {
  return left<MitamaError, T>({
    target,
    msg,
    meta: meta && {
      path: meta.path.toString(),
      memoriaName: meta.memoriaName,
    },
  });
};
