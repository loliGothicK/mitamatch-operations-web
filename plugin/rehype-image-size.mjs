import { visit } from 'unist-util-visit';

/**
 * Analyze local MDX images and add `width` and `height` attributes to the
 * generated `img` elements.
 * Supports both markdown-style images and MDX <Image /> components.
 */
export const rehypeImageSize = () => {
  return tree => {
    // This matches all images that use the markdown standard format ![label](path).
    visit(tree, { type: 'element', tagName: 'img' }, node => {
      node.properties.width = '100%';
      node.properties.height = 'auto';
    });
  };
};

export default rehypeImageSize;
