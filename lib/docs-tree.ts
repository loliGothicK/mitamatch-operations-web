type Doc = {
  title: string;
  slug: string; // 例: "/docs/getting-started/installation"
  section: number;
};

export type TreeNode = {
  title: string;
  url?: string; // フォルダ自体のページがない場合は undefined
  slug: string;
  children: TreeNode[];
};

export function buildDocsTree(docs: Doc[]): TreeNode[] {
  const root: TreeNode[] = [];

  // スラッグの短い順（階層の浅い順）に処理すると親を見つけやすい
  const sortedDocs = docs.toSorted((a, b) => a.section - b.section);

  for (const doc of sortedDocs) {
    // "/docs/category/page" -> ["docs", "category", "page"]
    // 先頭の空文字やルート(docs)を除去するかはプロジェクト構成による
    // ここでは "/docs" 以下のパスを階層として扱います
    const parts = doc.slug.split("/").filter((p) => p !== "" && p !== "docs");

    let currentLevel = root;
    let currentPath = "/docs";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath += `/${part}`;

      // 既存のノードを探す
      let node = currentLevel.find((n) => n.slug === currentPath);

      if (!node) {
        // ノードが存在しない場合、新しく作る
        node = {
          title: part, // 仮のタイトル（後でdocのtitleで上書きされるかも）
          slug: currentPath,
          children: [],
        };
        currentLevel.push(node);
      }

      // 最後のパーツ（＝現在のdocに対応するノード）の場合、情報を埋める
      if (i === parts.length - 1) {
        node.title = doc.title;
        node.url = `/docs/${doc.slug}`;
      }

      // 次の階層へ潜る
      currentLevel = node.children;
    }
  }

  return root;
}
