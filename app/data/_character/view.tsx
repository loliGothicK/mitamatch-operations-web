"use client";

import {
  Box,
  ButtonBase,
  Card,
  CardContent,
  CardMedia,
  Divider,
  Grid,
  Typography,
} from "@mui/material";
import { Character, characterList } from "@/domain/character/character";
import Link from "@/components/link";
import { pipe } from "fp-ts/function";
import { sort } from "fp-ts/Array";
import * as O from "fp-ts/Ord";
import * as N from "fp-ts/number";
import * as M from "fp-ts/Monoid";
import { match } from "ts-pattern";
import { styled } from "@mui/material/styles";

const byGarden = pipe(
  N.Ord,
  O.contramap((character: Character) =>
    match(character.garden)
      .with("百合ヶ丘女学院高等学校", () => 1)
      .with("エレンスゲ女学園高等学校", () => 2)
      .with("神庭女子藝術高等学校", () => 3)
      .with("御台場女学校", () => 4)
      .with("私立ルドビコ女学院", () => 5)
      .otherwise(() => Number.POSITIVE_INFINITY),
  ),
);
const byLegion = pipe(
  N.Ord,
  O.contramap((character: Character) =>
    match(character.legion)
      .with("一柳隊", () => 1)
      .with("アールヴヘイム", () => 2)
      .with("ローエングリン", () => 3)
      .with("レギンレイヴ", () => 4)
      .with("エイル", () => 5)
      .with("シュバルツグレイル", () => 6)
      .with("サングリーズル", () => 7)
      .with("シュヴェルトライテ", () => 8)
      .with("ヘルヴォル", () => 9)
      .with("クエレブレ", () => 10)
      .with("バシャンドレ", () => 11)
      .with("グラン・エプレ", () => 12)
      .with("神庭生徒会防衛隊", () => 13)
      .with("ロネスネス", () => 14)
      .with("ヘオロットセインツ", () => 15)
      .with("アイアンサイド", () => 16)
      .with("テンプルレギオン", () => 16)
      .otherwise(() => Number.POSITIVE_INFINITY),
  ),
);
const characterOrd = M.concatAll(O.getMonoid<Character>())([byGarden, byLegion]);

const gardenImage = (character: Character) =>
  match(character.garden)
    .with("", () => "url(/garden/garden_00.png)")
    .otherwise(() => `url(/garden/${character.garden}.png)`);

const ImageCardButton = styled(ButtonBase, {
  shouldForwardProp: (prop) => prop !== "keyColor",
})<{ keyColor: string }>(({ theme, keyColor }) => ({
  display: "block",
  textAlign: "initial",
  // Card要素全体
  "& .MuiCard-root": {
    // 👇 デフォルトの影を消して、代わりに薄い枠線を設定
    boxShadow: "none",
    border: `1px solid ${theme.palette.divider}`, // デフォルトの輪郭色
    transition: theme.transitions.create(["box-shadow", "transform", "border-color"]),
  },

  // ホバー/フォーカス時
  "&:hover, &.Mui-focusVisible": {
    zIndex: 1,
    "& .MuiCard-root": {
      boxShadow: theme.shadows[8],
      transform: "translateY(-2px)",
      border: `3px solid #${keyColor}`,
    },
  },
}));

export default function View() {
  const characters = sort(characterOrd)(
    characterList.filter(({ name, garden }) => !name.includes(garden) || garden.length === 0),
  );
  return (
    <Box
      sx={{
        width: { xs: "100%", md: "95%" },
        maxWidth: 1600,
        mx: "auto",
        p: { xs: 1, md: 3 },
        mt: { xs: 2, md: 4 },
      }}
    >
      <Grid container={true} spacing={{ xs: 2, md: 3 }} sx={{ alignItems: "stretch" }}>
        {characters.map((character) => (
          <Grid size={{ xs: 12, sm: 12, md: 6, lg: 4 }} key={character.name}>
            <Link href={`/data/character/${character.name}`} scroll={true} underline={"none"} sx={{ display: 'block', width: '100%' }}>
              <ImageCardButton
                focusRipple={true}
                sx={{
                  display: "flex",
                  width: "100%",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                keyColor={character.keyColor}
              >
                <Card sx={{ display: "flex", width: "100%" }}>
                  <CardMedia
                    component="img"
                    sx={{ width: { xs: 120, sm: 150 }, flexShrink: 0 }}
                    image={`/lily/${character.name}.jpg`}
                    alt={character.name}
                  />
                  <CardContent
                    sx={{
                      flex: 1,
                      position: "relative",
                      overflow: "hidden", // はみ出しを隠す
                      zIndex: 1, // コンテンツ（テキスト）を前に出す
                      padding: { xs: 2, sm: 3 }, // コンテンツのパディング
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundImage: gardenImage(character),
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        opacity: 0.2,
                        zIndex: -2,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                        height: "100%",
                        justifyContent: "center",
                        "&::before": {
                          content: '""',
                          backgroundColor: "primary",
                          position: "absolute",
                          backgroundSize: "cover",
                          opacity: 0.5,
                          zIndex: -1,
                        },
                      }}
                    >
                      <Typography component="div" variant="h5" sx={{ fontWeight: "bold", fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
                        {character.firstName}
                      </Typography>
                      <Divider sx={{ my: 1 }} flexItem={true} textAlign="left">
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: "bold" }}>Information</Typography>
                      </Divider>
                      <Typography component="div" variant="body2" color="text.secondary" sx={{ wordBreak: "break-all" }}>
                        {`CV: ${character.voiceActor}`}
                      </Typography>
                      <Typography component="div" variant="body2" color="text.secondary">
                        {`誕生日: ${character.birthday}`}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </ImageCardButton>
            </Link>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
