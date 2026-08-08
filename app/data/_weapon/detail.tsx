"use client";

import { notFound } from "next/navigation";
import { WeaponIcon } from "@/components/image/WeaponIcon";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Breadcrumbs,
  Paper,
  Stack,
  Chip,
  Divider,
} from "@mui/material";
import Link from "@/components/link";
import { weaponList } from "@/domain/weapon/weapon";
import FlashOnIcon from "@mui/icons-material/FlashOn";

export default function WeaponDetail({ id }: { id: string }) {
  const weapon = weaponList.find((item) => item.id === id);
  if (!weapon) notFound();

  return (
    <Box
      sx={{
        width: { xs: "100%", md: "80%" },
        maxWidth: 1200,
        mx: "auto",
        p: { xs: 1, md: 3 },
        mt: { xs: 2, md: 4 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          mb: 3,
          background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)",
          backdropFilter: "blur(10px)",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={3}
          sx={{ justifyContent: "flex-start", alignItems: { xs: "center", sm: "flex-start" } }}
        >
          <WeaponIcon weapon={weapon} size={120} />
          <Box sx={{ textAlign: { xs: "center", sm: "left" }, flexGrow: 1 }}>
            <Breadcrumbs
              separator="›"
              aria-label="breadcrumb"
              sx={{ justifyContent: { xs: "center", sm: "flex-start" }, display: "flex", mb: 1 }}
            >
              <Link underline="hover" color="inherit" href="/data">
                data
              </Link>
              <Link underline="hover" color="inherit" href="/data/weapon">
                weapon
              </Link>
              <Typography sx={{ color: "text.primary" }}>{weapon.name}</Typography>
            </Breadcrumbs>
            <Typography variant="h4" sx={{ fontWeight: "bold" }} gutterBottom>
              {weapon.name}
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                justifyContent: { xs: "center", sm: "flex-start" },
                mt: 1,
              }}
            >
              <Chip
                icon={<FlashOnIcon />}
                label={`ステータス合計: ${weapon.status.reduce((a, b) => a + b, 0)}`}
                size="small"
                variant="outlined"
                color="primary"
              />
            </Box>
          </Box>
        </Stack>
      </Paper>

      <Box sx={{ width: "100%" }}>
        <Divider textAlign="left" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: "bold" }}>
            CHARM詳細
          </Typography>
        </Divider>
        <Stack spacing={2} sx={{ width: "100%" }}>
          {weapon.effect.map((effect) => (
            <Card
              key={`${effect.kind}-${effect.description}`}
              variant="outlined"
              sx={{ borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 }, "&:last-child": { pb: { xs: 2, sm: 3 } } }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", color: "primary.main", mb: 1.5 }}
                >
                  {effect.kind}
                </Typography>
                <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.6 }}>
                  {effect.description}
                </Typography>
              </CardContent>
            </Card>
          ))}

          <Card
            variant="outlined"
            sx={{ borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 }, "&:last-child": { pb: { xs: 2, sm: 3 } } }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "primary.main", mb: 1.5 }}>
                ステータス
              </Typography>
              <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.6 }}>
                {weapon.status.join(" / ")}
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Box>
  );
}
