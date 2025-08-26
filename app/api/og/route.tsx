import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';
import { match } from 'ts-pattern';

export const runtime = 'edge';

const size = {
  width: 500,
  height: 500,
};

const style = {
  background: '#8bd0dd',
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap' as const,
};

export async function GET(reqest: NextRequest) {
  const params = reqest.nextUrl.searchParams;
  try {
    return match(params)
      .when(
        params => params.has('deck'),
        async params => {
          const param = params.get('deck') as string;
          const { legendary, deck } = (await fetch(
            new URL(`/api/deck?deck=${param}`, reqest.nextUrl),
          ).then(res => res.json())) as { legendary: string[]; deck: string[] };

          return new ImageResponse(
            <div style={style}>
              {legendary.map(name => {
                return (
                  // biome-ignore lint/performance/noImgElement: this function runs on the edge server
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
                  // biome-ignore lint/performance/noImgElement: this function runs on the edge server
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
        },
      )
      .when(
        params => params.has('timeline'),
        async params => {
          const param = params.get('timeline') as string;
          const { timeline } = (await fetch(
            new URL(`/api/timeline?timeline=${param}`, reqest.nextUrl),
          ).then(res => res.json())) as { timeline: string[] };

          return new ImageResponse(
            <div style={style}>
              {timeline.map(name => (
                // biome-ignore lint/performance/noImgElement: this function runs on the edge server
                <img
                  src={`https://github.com/loliGothicK/mitamatch-operations-web/raw/main/public/order/${name}.png`}
                  key={name}
                  alt={'memoria'}
                  width={100}
                  height={100}
                />
              ))}
            </div>,
            {
              width: 1200,
              height: 100,
            },
          );
        },
      )
      .otherwise(
        async () =>
          new Response('param (deck or timeline) not found', {
            status: 500,
          }),
      );
  } catch (_) {
    return new Response('Failed to generate the image', {
      status: 500,
    });
  }
}
