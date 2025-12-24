"use client";

import { MDXContent } from "@content-collections/mdx/react";
import { useMDXComponents } from "@/mdx-components";

interface MdxViewerProps {
  code: string;
}

export function MdxViewer({ code }: MdxViewerProps) {
  // Client Component なのでフックが安全に使える
  const components = useMDXComponents({});

  return <MDXContent code={code} components={components} />;
}
