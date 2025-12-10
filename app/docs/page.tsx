"use client";

import { Layout } from "@/components/layout/client";
import { Documents } from "@/components/docs/Documents";
import Intro from "@/mdx/index.mdx";
import "@/styles/markdown.css";

export default function Page() {
  return (
    <Layout>
      <Documents>
        <article className={"mitamatch-markdown"}>
          <Intro />
        </article>
      </Documents>
    </Layout>
  );
}
