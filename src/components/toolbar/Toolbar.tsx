import React, { ReactNode } from "react";
import { Paper, Stack, Box, Typography, Divider } from "@mui/material";

/**
 * ツールバー内の1つのグループを表すコンポーネント
 * 境界線やスペーシングのロジックをここに閉じ込める
 */
export const RibbonGroup: React.FC<{ children: ReactNode; label?: string }> = ({
  children,
  label,
}) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <Stack direction="row" spacing={0.5} alignItems="center">
        {children}
      </Stack>
      {/* ラベルが必要な場合のみ表示（Ribbon的な名残が必要なら） */}
      {label && (
        <Typography
          variant="caption"
          sx={{ fontSize: "0.65rem", color: "text.secondary", textAlign: "center", mt: 0.5 }}
        >
          {label}
        </Typography>
      )}
    </Box>
  );
};

export default function Ribbon({ children }: { children: ReactNode[] }) {
  return (
    <Paper
      elevation={2}
      sx={{
        p: 1,
        display: "flex",
        alignItems: "center", // 縦方向の中央揃え
        gap: 2, // グループ間の余白
        flexWrap: "wrap", // 画面幅が狭いときに折り返す（簡易レスポンシブ）
        minWidth: "100%",
        borderRadius: 1,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        // ここが魔法の intersperse です
        divider={<Divider orientation="vertical" flexItem />}
        spacing={0.5} // アイテム間の余白
        sx={{ p: 0.5 }}
      >
        {children}
      </Stack>
    </Paper>
  );
}
