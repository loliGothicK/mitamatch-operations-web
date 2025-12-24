"use client";

import React, { useState } from "react";
import Link from "@/components/link";
import { usePathname } from "next/navigation";
import { List, ListItemButton, ListItemText, Collapse, Box } from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { TreeNode } from "@/lib/docs-tree";

// 再帰的にレンダリングするアイテムコンポーネント
const SidebarItem = ({ node, level = 0 }: { node: TreeNode; level?: number }) => {
  const pathname = usePathname();
  const hasChildren = node.children.length > 0;

  // 現在のページがこのノードの子孫なら、デフォルトで開いておく
  const isActive = node.url === pathname;
  const isChildActive = pathname.startsWith(node.slug);

  const [open, setOpen] = useState(isChildActive);

  const handleClick = (e: React.MouseEvent) => {
    if (hasChildren) {
      // フォルダなら開閉
      e.preventDefault(); // リンク遷移を防ぐ（挙動はお好みで）
      setOpen(!open);
    }
  };

  return (
    <>
      <ListItemButton
        component={node.url ? Link : "div"} // URLがなければただのボタン
        href={node.url || "#"}
        selected={isActive}
        onClick={hasChildren ? handleClick : undefined}
        sx={{
          pl: 2 + level * 2, // インデント処理
          borderLeft: isActive ? "3px solid #1976d2" : "3px solid transparent", // アクティブ表示のデザイン例
        }}
      >
        <ListItemText primary={node.title} />
        {hasChildren ? open ? <ExpandLess /> : <ExpandMore /> : null}
      </ListItemButton>

      {hasChildren && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {node.children.map((child) => (
              <SidebarItem key={child.slug} node={child} level={level + 1} />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

// メインのコンポーネント
export const DocsSidebar = ({ tree }: { tree: TreeNode[] }) => {
  return (
    <Box sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}>
      <List component="nav">
        {tree.map((node) => (
          <SidebarItem key={node.slug} node={node} />
        ))}
      </List>
    </Box>
  );
};
