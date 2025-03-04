import { type Either, isLeft } from 'fp-ts/Either';
import { either, option } from 'fp-ts';
import { isSome, type Option } from 'fp-ts/Option';

type Flatten<T> = T extends unknown[] ? T : T[];

export const separator = <E, T>(
  seq: readonly Either<E, T>[],
): Either<Flatten<E>, Flatten<T>> => {
  const left = seq.filter(isLeft).map(l => l.left);
  const right = seq.filter(either.isRight).map(r => r.right);
  return left.length === 0
    ? either.right(right.flat() as Flatten<T>)
    : either.left(left.flat() as Flatten<E>);
};

export const transpose = <T>(seq: Option<T>[]): Option<T[]> => {
  const some = seq.filter(isSome);
  return some.length === 0
    ? option.none
    : option.of([...some.map(s => s.value)]);
};
