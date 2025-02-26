import { mapLeft, type Either } from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';

export type Validated<E, A> = Either<E[], A>;

export const lift: <E, A>(body: Either<E, A>) => Validated<E, A> = body =>
  pipe(
    body,
    mapLeft(a => [a]),
  );
