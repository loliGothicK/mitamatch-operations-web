import { Either, left } from "fp-ts/Either";
import { Validated } from "@/fp-ts-ext/Validated";

export type MitamaError = {
  target: string;
  msg: string;
  meta?: {
    path: string;
    memoriaName?: string;
  };
};

export type Result<T> = Either<MitamaError, T>;
export type ValidateResult<T> = Validated<MitamaError, T>;

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

export const anyhow = (
  target: string,
  msg: string,
  meta?: { path: CallPath; memoriaName?: string },
): MitamaError => {
  return {
    target,
    msg,
    meta: meta && {
      path: meta.path.toString(),
      memoriaName: meta.memoriaName,
    },
  };
};

export const bail = <T = never>(
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
