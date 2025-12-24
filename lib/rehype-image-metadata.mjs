import { visit } from 'unist-util-visit';
import sizeOf from 'image-size';
import path from 'path';

// Node.jsのプロセス実行ディレクトリ（プロジェクトルート）
const rootDir = process.cwd();

export function rehypeImageMetadata() {
    return (tree) => {
        visit(tree, 'element', (node) => {
            // MDX内の <img> タグ（Markdownの ![alt](src) から変換されたもの）を探す
            if (node.tagName === 'img' && node.properties.src) {
                const src = node.properties.src;

                // publicフォルダ内のローカル画像（/から始まるパス）のみを対象とする
                // <Image
                //     src={myImage}
                //     alt="Description"
                //     width={800}   // 画像の元の幅
                //     height={600}  // 画像の元の高さ
                //     sizes="80vw" // 重要: ビューポート幅に応じた適切な画像サイズを選択させる
                //     style={{
                //       width: '100%', // 親要素に合わせて幅いっぱい
                //       height: 'auto', // アスペクト比を維持
                //     }}
                //   />
                if (src.startsWith('/')) {
                    try {
                        // 実際のファイルパスを構築してサイズを取得
                        const imagePath = path.join(rootDir, 'public', src);
                        const dimensions = sizeOf(imagePath);

                        // width と height プロパティをノードに注入
                        node.properties.src = src;
                        node.properties.width = dimensions.width;
                        node.properties.height = dimensions.height;
                        node.properties.sizes = '80vw';
                        node.properties.style = { width: '100%', height: 'auto' };
                    } catch (e) {
                        console.warn(`[rehype-image-metadata] Warning: Could not get size for image: ${src}. Error: ${e.message}`);
                    }
                }
            }
        });
    };
}
