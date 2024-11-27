import type { MDXComponents } from 'mdx/types';

export function useMdxComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
  };
}
