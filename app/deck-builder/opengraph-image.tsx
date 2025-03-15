import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image(request: NextRequest) {
  const deck = request.nextUrl.searchParams.get('deck');
  const title = request.nextUrl.searchParams.get('title');
  const deckJson = deck
    ? ((await fetch(new URL(`/api/deck?deck=${deck}`, request.nextUrl)).then(
        res => res.json(),
      )) as { deck: string[] })
    : null;

  return new ImageResponse(
    <div
      style={{
        background: '#8bd0dd',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {deckJson?.deck.map(name => {
          return (
            <img
              src={`https://github.com/loliGothicK/mitamatch-operations-web/raw/main/public/memoria/${name}.png`}
              key={name}
              alt={'memoria'}
              style={{
                width: 50,
                height: 50,
                objectFit: 'contain',
              }}
            />
          );
        })}
      <p
        style={{
          fontSize: 32,
          marginTop: 24,
        }}
      >
        {title || 'Deck'}
      </p>
    </div>,
    {
      ...size,
    },
  );
}
