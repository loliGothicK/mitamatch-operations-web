import Image from "next/image";
import { Box } from "@mui/material";
import { ImageWithFallback } from "@/components/image/ImageWithFallback";
import { ImageProps } from "next/dist/shared/lib/get-img-props";
import { StrictOmit } from "ts-essentials";
import { type Weapon } from "@/domain/weapon/weapon";

export function WeaponIcon({
  weapon: { resourceId, name },
  size,
  ...option
}: { weapon: Weapon; size?: number } & StrictOmit<
  ImageProps,
  "src" | "alt" | "width" | "height"
>) {
  const containerSize = size ?? 100;

  return (
    <Box sx={{ position: "relative", width: containerSize, height: containerSize, flexShrink: 0 }}>
      <Box
        sx={{
          zIndex: 0,
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        <Image src={"/assets/Blank.png"} alt={"blank"} width={containerSize} height={containerSize} />
      </Box>
      <Box
        sx={{
          zIndex: 1,
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        <ImageWithFallback
          src={`/weapon/${resourceId}.png`}
          fallback={"/assets/Blank.png"}
          alt={name}
          width={containerSize}
          height={containerSize}
          {...option}
        />
      </Box>
    </Box>
  );
}
