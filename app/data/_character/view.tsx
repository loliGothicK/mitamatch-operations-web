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
        width: "80%",
        mx: "auto",
        p: 3,
        mt: 4,
      }}
    >
      <Grid container={true} spacing={2}>
        {characters.map((character) => (
          <Grid size={3} key={character.name}>
            <Link href={`/data/character/${character.name}`} scroll={true} underline={"none"}>
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
                    sx={{ width: 150 }}
                    image={`/lily/${character.name}.jpg`}
                    alt={character.name}
                  />
                  <CardContent
                    sx={{
                      flex: "1 0 auto",
                      position: "relative",
                      overflow: "hidden", // はみ出しを隠す
                      zIndex: 1, // コンテンツ（テキスト）を前に出す
                      padding: 3, // コンテンツのパディング
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
                        position: "absolute",
                        top: 0,
                        left: 0,
                        padding: 2,
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
                      <Typography component="div" variant="h4">
                        {character.firstName}
                      </Typography>
                      <Divider sx={{ margin: 2 }} flexItem={true} textAlign="left">
                        {"Infomation"}
                      </Divider>
                      <Typography component="div" variant="body1">
                        {`CV: ${character.voiceActor}`}
                      </Typography>
                      <Typography component="div" variant="body1">
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
