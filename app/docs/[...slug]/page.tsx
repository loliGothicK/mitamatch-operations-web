'use client';

import { Layout } from '@/components/Layout';
import { Documents } from '@/components/docs/Documents';
import '@/styles/markdown.css';
import { Breadcrumbs, Grid2 as Grid } from '@mui/material';
import Link from '@mui/material/Link';
import { takeLeft } from 'fp-ts/Array';
import { Suspense, lazy, useEffect } from 'react';
import { destroy, init } from 'tocbot';

const Toc = () => {
  useEffect(() => {
    init({
      tocSelector: '.toc', //　目次を追加する class 名
      contentSelector: '.mitamatch-markdown', // 目次を取得するコンテンツの class 名
      headingSelector: 'h2', // 目次として取得する見出しタグ
      headingsOffset: 70, // ヘッダーのオフセット
      scrollSmoothOffset: -70, // スクロール時のオフセット
    });

    // 不要となったtocbotインスタンスを削除
    return () => destroy();
  }, []);

  return (
    <nav
      className='toc'
      style={{
        position: 'sticky',
        top: 70,
        maxHeight: 'calc(100vh - 70px)',
        overflowY: 'auto',
      }}
    />
  );
};

export default async function Page({
  params,
}: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const DocComponent = lazy(() => {
    return slug.length === 1
      ? import(`@/docs/${slug[0]}/index.mdx`)
      : import(`@/docs/${slug.join('/')}.mdx`);
  });

  return (
    <Layout>
      <Documents>
        <Suspense>
          <Grid container direction={'row-reverse'}>
            <Grid
              minHeight={'100vh'}
              size={{ md: 3 }}
              sx={{ display: { xs: 'none', lg: 'block' } }}
            >
              <Toc />
            </Grid>
            <Grid size={{ xs: 12, md: 9 }}>
              <Breadcrumbs separator={'›'} aria-label='breadcrumb'>
                <Link href='/docs'>Docs</Link>
                {slug.length > 1 ? (
                  slug
                    .slice(0, slug.length - 1)
                    .map((title, index) => (
                      <Link
                        key={title}
                        href={`/docs/${takeLeft(index + 1)(slug).join('/')}`}
                      >
                        {title}
                      </Link>
                    ))
                    // biome-ignore lint/complexity/noUselessFragments: <explanation>
                    .concat(<>{slug[slug.length - 1]}</>)
                ) : (
                  <> {slug[0]}</>
                )}
              </Breadcrumbs>
              <article className='mitamatch-markdown'>
                <DocComponent />
              </article>
            </Grid>
          </Grid>
        </Suspense>
      </Documents>
    </Layout>
  );
}
