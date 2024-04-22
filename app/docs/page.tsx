'use client';

import { Layout } from '@/components/Layout';
import { Documents } from '@/components/docs/Documents';
import Intro from '@/docs/index.mdx';
import '@/styles/markdown.css';

export default function Page() {
  return (
    <Layout>
      <Documents>
        <article className={'mitamatch-markdown'}>
          <Intro />
        </article>
      </Documents>
    </Layout>
  );
}
