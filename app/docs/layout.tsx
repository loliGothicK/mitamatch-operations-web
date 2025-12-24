// app/docs/layout.tsx (例)
import { allDocs } from "content-collections"; // 生成されたデータをインポート
import { buildDocsTree } from "@/lib/docs-tree";
import { DocsSidebar } from "@/components/mdx/DocsSidebar";
import { Box, Paper } from "@mui/material";
import { ReactNode } from "react"; // Grid2推奨ですが一旦Gridで

export default function DocsLayout({ children }: { children: ReactNode }) {
  // 1. データを変換
  const tree = buildDocsTree(allDocs);

  return (
    <Box
      sx={{
        flexGrow: 1, // AppBar 以外の高さを全部使う
        display: "grid",
        gridTemplateColumns: "210px minmax(0, 1fr)", // ここで横分割
        overflow: "hidden", // 内部スクロールのために必要
      }}
    >
      {/* サイドバー */}
      <Paper
        elevation={0}
        sx={{
          display: "flex",
          flexDirection: "row",
          borderRight: "1px solid rgba(0,0,0,0.12)",
          overflow: "hidden",
          minHeight: "100vh",
          height: "100%",
        }}
      >
        <Box position="sticky" top={20} sx={{ maxHeight: "calc(100vh - 40px)", overflowY: "auto" }}>
          <DocsSidebar tree={tree} />
        </Box>
      </Paper>

      {/* メインコンテンツエリア */}
      <Box
        component="main"
        sx={{
          overflowY: "auto",
          padding: 2,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
