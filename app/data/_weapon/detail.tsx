"use client";

import { notFound } from "next/navigation";
import { WeaponIcon } from "@/components/image/WeaponIcon";
import { Box, Card, CardContent, Typography } from "@mui/material";
import Link from "@/components/link";
import { weaponList } from "@/domain/weapon/weapon";

export default function WeaponDetail({ id }: { id: string }) {
  const weapon = weaponList.find((item) => item.id === id);
  if (!weapon) notFound();

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Link href="/data/weapon">← Weapon data</Link>
      <Card sx={{ mt: 2, maxWidth: 900 }}>
        <CardContent sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
          <WeaponIcon weapon={weapon} size={160} />
          <Box sx={{ flex: 1, minWidth: 280 }}>
            <Typography variant="h4" gutterBottom>
              {weapon.name}
            </Typography>
            {weapon.effect.map((effect) => (
              <Box key={`${effect.kind}-${effect.description}`} sx={{ mb: 2 }}>
                <Typography variant="h6">{effect.kind}</Typography>
                <Typography color="text.secondary">{effect.description}</Typography>
              </Box>
            ))}
            <Typography>Status: {weapon.status.join(" / ")}</Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
