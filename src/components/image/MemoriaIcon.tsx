import type { Memoria } from "@/domain/memoria/memoria";
import Image from "next/image";
import { Box } from "@mui/material";
import { ImageWithFallback } from "@/components/image/ImageWithFallback";
import { ImageProps } from "next/dist/shared/lib/get-img-props";
import { StrictOmit } from "ts-essentials";
import { CardTypeIcon } from "@/components/image/cardType";

export function MemoriaIcon({
  memoria: { uniqueId, name, cardType, attribute, labels },
  size,
  ...option
}: { memoria: Memoria; size?: number } & StrictOmit<
  ImageProps,
  "src" | "alt" | "width" | "height"
>) {
  const containerSize = size ?? 100;
  return (
    <Box sx={{ position: "relative", width: containerSize, height: containerSize, flexShrink: 0 }}>
      <Box
        sx={{
          position: "absolute",
          top: -1,
          right: -1,
          zIndex: 4,
        }}
      >
        <CardTypeIcon cardType={cardType} attribute={attribute} size={size ? size * 0.34 : 34} />
      </Box>
      {labels.includes("Legendary") && (
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            zIndex: 3,
          }}
        >
          <Image
            src={"/assets/LegendaryIcon.png"}
            alt={"LegendaryIcon"}
            width={size ? size * 0.3 : 30}
            height={size ? size * 0.3 : 30}
            unoptimized
            style={{
              width: size ? size * 0.3 : 30,
              height: size ? size * 0.3 : 30,
              position: "absolute",
              bottom: 0,
              left: 0,
            }}
          />
        </Box>
      )}
      <Box
        sx={{
          position: "absolute",
          zIndex: 2,
        }}
      >
        {labels.includes("Ultimate") ? (
          <Image
            src={"/assets/IconRarity08LImage.png"}
            alt={"frame"}
            width={size ?? 100}
            height={size ?? 100}
            unoptimized
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <Image
            src={"/assets/IconRarity06LImage.png"}
            alt={"frame"}
            width={size ?? 100}
            height={size ?? 100}
            unoptimized
            style={{ width: "100%", height: "100%" }}
          />
        )}
      </Box>
      <ImageWithFallback
        src={`/memoria/${uniqueId}.png`}
        fallback={"/memoria/CommingSoon.jpeg"}
        alt={name.full}
        width={size ?? 100}
        height={size ?? 100}
        {...option}
      />
    </Box>
  );
}
