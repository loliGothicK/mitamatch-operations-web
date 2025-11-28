import { Box, Card, CardContent, CardMedia, Grid, Typography } from "@mui/material";
import { Character, characterList } from "@/domain/character/character";
import Link from "@/components/link";
import { pipe } from "fp-ts/function";
import { sort } from "fp-ts/Array";
import * as O from "fp-ts/Ord";
import * as N from "fp-ts/number";
import { match } from "ts-pattern";

// 1. name (文字列の昇順)
const byGarden = pipe(
  N.Ord,
  O.contramap((character: Character) =>
    match(character.garden)
      .with("百合ヶ丘女学院高等学校", () => 1)
      .with("エレンスゲ女学園高等学校", () => 2)
      .with("神庭女子藝術高等学校", () => 3)
      .with("御台場女学校", () => 4)
      .with("私立ルドビコ女学院", () => 5)
      .with("", () => Number.POSITIVE_INFINITY)
      .run(),
  ),
);

export default function View() {
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
        {sort(byGarden)(
          characterList.filter(({ name, garden }) => !name.includes(garden) || garden.length === 0),
        ).map((character) => (
          <Grid size={3} key={character.name}>
            <Link href={`/data/character/${character.name}`}>
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
