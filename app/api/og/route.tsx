import { ImageResponse } from 'next/og';
import {NextRequest} from "next/server";

export const runtime = 'edge';

export const size = {
  width: 500,
  height: 500,
};
export const contentType = 'image/png';

export async function GET(reqest: NextRequest) {
  const param = reqest.nextUrl.searchParams.get('deck');
  if (param === null) {
    return new Response('Deck not found', {
      status: 500,
    });
  }
  try {
    const { legendary, deck } = await fetch(new URL(`/api/deck?deck=${param}`, reqest.nextUrl)).then(
        res => res.json(),
      ) as { legendary: string[], deck: string[] };

    return new ImageResponse(
      <div
        style={{
          background: '#8bd0dd',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        {legendary.map(name => {
          return (
            <img
              src={`https://github.com/loliGothicK/mitamatch-operations-web/raw/main/public/memoria/${name}.png`}
              key={name}
              alt={'memoria'}
              width={100}
              height={100}
            />
          );
        })}
        <div
          key={'divider'}
          style={{
            gridColumn: '1 / -1',
            height: '2px',
            background: '#000',
            margin: '10px 0',
          }}
        />
        {deck.map(name => {
          return (
            <img
              src={`https://github.com/loliGothicK/mitamatch-operations-web/raw/main/public/memoria/${name}.png`}
              key={name}
              alt={'memoria'}
              width={100}
              height={100}
            />
          );
        })}
      </div>,
      {
        ...size,
      },
    );
  }
  catch (error: any) {
    console.log(`${error.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
