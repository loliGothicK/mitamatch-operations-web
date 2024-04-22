'use client';

import { Layout } from '@/components/Layout';
import { Documents } from '@/components/docs/Documents';
import '@/styles/markdown.css';
import { Breadcrumbs, Grid } from '@mui/material';
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

export default function Page({ params }: { params: { slug: string[] } }) {
  const DocComponent = lazy(() => {
    return params.slug.length === 1
      ? import(`@/docs/${params.slug[0]}/index.mdx`)
      : import(`@/docs/${params.slug.join('/')}.mdx`);
  });

  return (
    <Layout>
      <Documents>
        <Suspense>
          <Grid container direction={'row-reverse'}>
            <Grid
              item
              md={3}
              minHeight={'100vh'}
              sx={{ display: { xs: 'none', lg: 'block' } }}
            >
              <Toc />
            </Grid>
            <Grid item xs={12} md={9}>
              <Breadcrumbs separator={'›'} aria-label='breadcrumb'>
                <Link href='/docs'>Docs</Link>
                {params.slug.length > 1 ? (
                  params.slug
                    .slice(0, params.slug.length - 1)
                    .map((slug, index) => (
                      <Link
                        key={slug}
                        href={`/docs/${takeLeft(index + 1)(params.slug).join(
                          '/',
                        )}`}
                      >
                        {slug}
                      </Link>
                    ))
                    // biome-ignore lint/complexity/noUselessFragments: <explanation>
                    .concat(<>{params.slug[params.slug.length - 1]}</>)
                ) : (
                  <> {params.slug[0]}</>
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
