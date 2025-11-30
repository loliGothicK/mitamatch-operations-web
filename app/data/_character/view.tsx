import { Box, Card, CardContent, CardMedia, Grid, Typography } from "@mui/material";
import { Character, characterList } from "@/domain/character/character";
import Link from "@/components/link";
import { pipe } from "fp-ts/function";
import { sort } from "fp-ts/Array";
import * as O from "fp-ts/Ord";
import * as N from "fp-ts/number";
import * as M from "fp-ts/Monoid";
import { match } from "ts-pattern";

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
const characterOrd = M.concatAll(O.getMonoid<Character>())([
  byGarden,
  byLegion,
]);

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
            <Link href={`/data/character/${character.name}`} scroll={true}>
              <Card sx={{ display: "flex", width: "100%" }}>
                <CardMedia
                  component="img"
                  sx={{ width: 150 }}
                  image={`/lily/${character.name}.jpg`}
                  alt={character.name}
                />
                <CardContent sx={{ flex: "1 0 auto" }}>
                  <Typography component="div" variant="h5">
                    {character.firstName}
                  </Typography>
                </CardContent>
              </Card>
            </Link>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
