import type { ThemeOptions } from "@mui/material/styles";

export const lightTheme: ThemeOptions = {
  palette: {
    mode: "light",
    background: {
      default: "#fff0f5",
      paper: "#ffffff",
    },
    text: {
      primary: "rgba(0, 0, 0, 0.87)",
      secondary: "rgba(0, 0, 0, 0.6)",
      disabled: "rgba(0, 0, 0, 0.38)",
    },
    // アクション色は少し濃い目の緑を採用して視認性を上げる
    action: {
      active: "#7a8f4b",
      hover: "rgba(122, 143, 75, 0.08)",
      selected: "rgba(122, 143, 75, 0.16)",
      disabled: "rgba(0, 0, 0, 0.26)",
      disabledBackground: "rgba(0, 0, 0, 0.12)",
    },
    primary: {
      // main: 少し濃いピンク（撫子色・オールドローズ系）にして、白文字が読めるように
      main: "#d06085",
      // light: 元の淡い桜色はこちら（ホバー時や背景色として使用）
      light: "#f7c8da",
      // dark: より深い色
      dark: "#9c3059",
      // ボタン上の文字色を白に強制
      contrastText: "#fff",
    },
    secondary: {
      // main: 少し濃い抹茶色。白文字も黒文字もいけるバランス
      main: "#8fa34b",
      // light: 元の淡い緑（抹茶ラテ色）
      light: "#b5c97c",
      // dark: 深い緑
      dark: "#607030",
      contrastText: "#fff",
    },
    success: {
      main: "#4caf50",
      light: "#80e27e", // 修正: lightは明るく
      dark: "#087f23",  // 修正: darkは暗く
    },
    error: {
      main: "#f44336",
      light: "#ff7961", // 修正: lightは明るく
      dark: "#ba000d",  // 修正: darkは暗く
    },
  },
};

// ダークテーマは元のままでも雰囲気が出ていますが、light/darkの定義が逆転していた箇所を微修正しました
export const darkTheme: ThemeOptions = {
  palette: {
    mode: "dark",
    text: {
      primary: "#fbe5eb",
      secondary: "rgba(255, 255, 255, 0.7)",
      disabled: "rgba(155, 155, 155)",
    },
    action: {
      active: "#f4b3ca",
      hover: "rgba(244, 179, 202, 0.08)",
      selected: "rgba(244, 179, 202, 0.16)",
      disabled: "rgba(244, 179, 202, 0.3)",
      disabledBackground: "rgba(244, 179, 202, 0.12)",
    },
    background: {
      default: "#121212",
      paper: "#1e1e1e", // ダークモードでも少し明るくして階層を表現（お好みで）
    },
    primary: {
      main: "#ce7a96", // ダークモードでは少し彩度を落としつつ明るくすると見やすい
      light: "#ffabc6",
      dark: "#9c4b69",
    },
    secondary: {
      main: "#8fa34b",
      light: "#c0d47a",
      dark: "#60721f",
    },
    success: {
      main: "#4caf50",
      light: "#80e27e",
      dark: "#087f23",
    },
    error: {
      main: "#f44336",
      light: "#ff7961",
      dark: "#ba000d",
    },
  },
};