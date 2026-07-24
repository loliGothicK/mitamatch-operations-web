import type { Memoria } from "@/domain/memoria/memoria";
import { match } from "ts-pattern";
import Image from "next/image";
import { Avatar, Box } from "@mui/material";
import { blue, green, grey, purple, red, yellow } from "@mui/material/colors";
import { ImageWithFallback } from "@/components/image/ImageWithFallback";
import { ImageProps } from "next/dist/shared/lib/get-img-props";
import { StrictOmit } from "ts-essentials";
import { Costume } from "@/domain/costume/costume";
import { CardTypeIcon } from "@/components/image/cardType";

export function CostumeIcon({
  costume: { uniqueId, name, cardType },
  size,
  ...option
}: { costume: Costume; size?: number } & StrictOmit<
  ImageProps,
  "src" | "alt" | "width" | "height"
>) {
  return (
    <Box sx={{ position: "relative" }}>
      <Box
        sx={{
          zIndex: 0,
          position: "absolute",
        }}
      >
        <Image src={"/assets/Blank.png"} alt={"blank"} width={size ?? 100} height={size ?? 100} />
      </Box>
      <Box
        sx={{
          zIndex: 1,
          position: "absolute",
        }}
      >
        <ImageWithFallback
          src={`/costume/icon/${uniqueId}.png`}
          fallback={"/memoria/CommingSoon.jpeg"}
          alt={name}
          width={size ?? 100}
          height={size ?? 100}
          {...option}
        />
      </Box>
      <Box
        sx={{
          position: "absolute",
          zIndex: 3,
        }}
      >
        <CardTypeIcon
          cardType={match(cardType)
            .with("通常単体", () => 1 as const)
            .with("通常範囲", () => 2 as const)
            .with("特殊単体", () => 3 as const)
            .with("特殊範囲", () => 4 as const)
            .with("支援", () => 5 as const)
            .with("妨害", () => 6 as const)
            .with("回復", () => 7 as const)
            .exhaustive()}
          size={size ? size * 0.34 : 34}
          left={size ? size * 0.63 : 63}
        />
      </Box>
    </Box>
  );
}
