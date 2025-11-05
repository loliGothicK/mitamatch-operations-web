import { type Either, isLeft } from "fp-ts/Either";
import { either, option } from "fp-ts";
import { isSome, type Option } from "fp-ts/Option";
import { match } from "ts-pattern";
import { pipe } from "fp-ts/function";
import { of } from "fp-ts/Array";

export const iter = <T>(a: Option<T>) =>
  pipe(
    a,
    option.map(of),
    option.getOrElse((): T[] => []),
  );

export type Flatten<T> = T extends unknown[] ? T : T[];

export const separator = <E, T>(
  seq: readonly Either<E, T>[],
): Either<Flatten<E>, Flatten<T>> => {
  const left = seq.filter(isLeft).map((l) => l.left);
  const right = seq.filter(either.isRight).map((r) => r.right);
  return left.length === 0
    ? either.right(right.flat() as Flatten<T>)
    : either.left(left.flat() as Flatten<E>);
};

export function transposeArray<T>(seq: Option<T>[]): Option<T[]> {
  const some = seq.filter(isSome);
  return some.length === 0 ? option.none : option.of(some.map((s) => s.value));
}

const isEither = <T, E>(
  m: Option<Either<E, T>> | Either<E, Option<T>>,
): m is Either<E, Option<T>> => m._tag === "Right" || m._tag === "Left";

export function transpose<E, T>(
  input: Option<Either<E, T>>,
): Either<E, Option<T>>;
export function transpose<E, T>(
  input: Either<E, Option<T>>,
): Option<Either<E, T>>;
export function transpose<E, T>(
  input: Option<Either<E, T>> | Either<E, Option<T>>,
): Either<E, Option<T>> | Option<Either<E, T>> {
  return match(input)
    .when(isEither<T, E>, (m): Option<Either<E, T>> => {
      return either.isLeft(m)
        ? option.of(m)
        : option.isSome(m.right)
          ? option.of(either.right(m.right.value))
          : option.none;
    })
    .otherwise((m): Either<E, Option<T>> => {
      return option.isNone(m)
        ? either.right(option.none)
        : either.isLeft(m.value)
          ? either.left(m.value.left)
          : either.right(option.some(m.value.right));
    });
}
