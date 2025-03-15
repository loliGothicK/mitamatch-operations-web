import { ImageResponse } from 'next/og';
import { restore } from '@/actions/restore';

export const runtime = 'edge';

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({
  params: { deck, title },
}: { params: { deck: string; title: string } }) {
  const unit = await restore({ target: 'deck', param: deck });

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
      {unit.deck.map(memoria => {
        return (
          <img
            key={memoria.id}
            alt={'memoria'}
            src={`https://github.com/loliGothicK/mitamatch-operations-web/raw/main/public/memoria/${memoria.name}.png`}
            width={50}
            height={50}
          />
        );
      })}
      <p
        style={{
          fontSize: 32,
          marginTop: 24,
        }}
      >
        {title}
      </p>
    </div>,
    {
      ...size,
    },
  );
}
