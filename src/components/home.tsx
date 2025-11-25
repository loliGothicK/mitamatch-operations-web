import { Box, Card, CardActionArea, CardContent, CardMedia, Typography } from "@mui/material";
import "@/components/home/home.css";
import Image from "next/image";
import { useTheme } from "@mui/material/styles";
import Grid from "@mui/material/Grid";
import { redirect } from "next/navigation";

export default function Home() {
  const theme = useTheme();
  return (
    <Grid sx={{ display: "flex", direction: "row", flexWrap: "wrap" }}>
      <Grid
        size={12}
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 4,
          padding: 4,
          minHeight: "50vh",
        }}
      >
        <Box className="hero-image" width={1500} height={500}>
          <Box zIndex={2}>
            <Image
              src={theme.palette.mode === "dark" ? "/MO_DARK.png" : "/MO_LIGHT.png"}
              alt={"Mitamatch Operations"}
              width={1500}
              height={500}
            />
          </Box>
          <Box className="animation-circle circle-1" />
          <Box className="animation-circle circle-2" />
          <Box className="animation-circle circle-3" />
          <Box className="animation-circle circle-4" />
          <Box className="animation-circle circle-5" />
        </Box>
      </Grid>
      <Grid
        size={12}
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 4,
          padding: 4,
          minHeight: "50vh",
          backgroundColor: theme.palette.primary.dark,
        }}
      >
        <Typography component="h1" variant="h2">
          レギオンマッチを"次"のレベルへ
        </Typography>
        <Typography variant="h6">
          {
            "Mitamatch Operationsは、データ駆動型のアプローチで複雑なレギオンマッチを簡素化し、レギオンマッチの改善効率を最大300%向上させるプラットフォームです。"
          }
        </Typography>
      </Grid>
      <Grid
        size={12}
        sx={{
          display: "grid",
          alignItems: "center",
          justifyContent: "center",
          gridTemplateColumns: "repeat(auto-fit, 1fr)",
          gridTemplateRows: "repeat(auto-fit, 1fr)",
          gridTemplateAreas: `
            "title title"
            "feature1 feature2"
            "feature3 feature4"
          `,
          gap: 4,
          padding: 4,
          minHeight: "50vh",
          backgroundColor: "rgba(255, 255, 255, 0.05)",
        }}
      >
        <Box sx={{ fontSize: 16, gridArea: "title" }}>
          <Typography component="h1" variant="h2">
            革新的な機能
          </Typography>
        </Box>
        <Feature
          image={"/docs/deck-builder-structure.png"}
          title={"Deck Builder"}
          description={
            "Deck Builderは、ユニットの最適化を助けるツールです。ゲーム内にはない豊富な機能を提供します。出来上がったユニットを保存し、他のユーザーと共有することも可能です。"
          }
          gridArea={"feature1"}
          action={() => redirect("/deck-builder")}
        />
        <Feature
          image={"/docs/timeline-builder.png"}
          title={"Timeline Builder"}
          description={
            "Timeline Builderは、レギオンマッチのタイムラインを作成するツールです。オーダーの順番やスキルの発動タイミングをシミュレーションし、最適な戦略を練ることができます。"
          }
          gridArea={"feature2"}
          action={() => redirect("/timeline-builder")}
        />
      </Grid>
      <Grid
        size={12}
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 4,
          padding: 4,
          minHeight: "50vh",
          backgroundColor: theme.palette.primary.dark,
        }}
      >
        <Typography component="h1" variant="h2">
          レギオンマッチの変革を始めましょう
        </Typography>
      </Grid>
    </Grid>
  );
}

function Feature({
  image,
  title,
  description,
  gridArea,
  action,
}: {
  image: string;
  title: string;
  description: string;
  gridArea: string;
  action: () => void;
}) {
  return (
    <Card sx={{ gridArea }}>
      <CardActionArea onClick={action}>
        <CardMedia component="img" height="250" image={image} alt="deck builder" />
        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
