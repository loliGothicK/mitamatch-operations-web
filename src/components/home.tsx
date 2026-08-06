"use client";

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
          gap: { xs: 2, md: 4 },
          padding: { xs: 2, md: 4 },
          minHeight: { xs: "30vh", md: "50vh" },
        }}
      >
        <Box className="hero-image" sx={{ width: "100%", maxWidth: 1500, position: "relative" }}>
          <Box sx={{ zIndex: 2, width: "100%" }}>
            <Image
              src={theme.palette.mode === "dark" ? "/MO_DARK.png" : "/MO_LIGHT.png"}
              alt={"Mitamatch Operations"}
              width={1500}
              height={500}
              loading="eager"
              unoptimized
              style={{ width: "100%", height: "auto" }}
            />
          </Box>
          <Box className="animation-circle circle-1" sx={{ display: { xs: "none", md: "block" } }} />
          <Box className="animation-circle circle-2" sx={{ display: { xs: "none", md: "block" } }} />
          <Box className="animation-circle circle-3" sx={{ display: { xs: "none", md: "block" } }} />
          <Box className="animation-circle circle-4" sx={{ display: { xs: "none", md: "block" } }} />
          <Box className="animation-circle circle-5" sx={{ display: { xs: "none", md: "block" } }} />
        </Box>
      </Grid>
      <Grid
        size={12}
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: { xs: 2, md: 4 },
          padding: { xs: 3, md: 4 },
          minHeight: { xs: "30vh", md: "50vh" },
          backgroundColor: theme.palette.primary.dark,
          textAlign: "center",
        }}
      >
        <Typography component="h1" variant="h2" sx={{ fontSize: { xs: "2rem", md: "3.75rem" } }}>
          レギオンマッチを"次"のレベルへ
        </Typography>
        <Typography variant="h6" sx={{ fontSize: { xs: "1rem", md: "1.25rem" }, maxWidth: "800px" }}>
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
          gridTemplateColumns: { xs: "1fr", md: "repeat(auto-fit, minmax(300px, 1fr))" },
          gridTemplateAreas: {
            xs: `
              "title"
              "feature1"
              "feature2"
            `,
            md: `
              "title title"
              "feature1 feature2"
            `,
          },
          gap: { xs: 3, md: 4 },
          padding: { xs: 3, md: 4 },
          minHeight: { xs: "30vh", md: "50vh" },
          backgroundColor: "rgba(255, 255, 255, 0.05)",
        }}
      >
        <Box sx={{ gridArea: "title", textAlign: "center", mb: { xs: 0, md: 2 } }}>
          <Typography component="h1" variant="h2" sx={{ fontSize: { xs: "2rem", md: "3.75rem" } }}>
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
          gap: { xs: 2, md: 4 },
          padding: { xs: 3, md: 4 },
          minHeight: { xs: "30vh", md: "50vh" },
          backgroundColor: theme.palette.primary.dark,
          textAlign: "center",
        }}
      >
        <Typography component="h1" variant="h2" sx={{ fontSize: { xs: "2rem", md: "3.75rem" } }}>
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
