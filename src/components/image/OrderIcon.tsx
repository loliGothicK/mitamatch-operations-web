import type { Order } from "@/domain/order/order";
import { ImageWithFallback } from "@/components/image/ImageWithFallback";
import { ImageProps } from "next/dist/shared/lib/get-img-props";
import { StrictOmit } from "ts-essentials";
import { Box } from "@mui/system";
import Image from "next/image";

export function OrderIcon({
  order,
  size,
  ...option
}: { order: Order | { id: string | number; name: string }; size?: number } & StrictOmit<
  ImageProps,
  "src" | "alt" | "width" | "height"
>) {
  const containerSize = size ?? 100;

  return (
    <Box sx={{ position: "relative", width: containerSize, height: containerSize, flexShrink: 0 }}>
      <Box
        sx={{
          zIndex: 2,
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        <Image
          src={"/assets/IconRarity06LImage.png"}
          alt={"frame"}
          width={containerSize}
          height={containerSize}
        />
      </Box>
      <Box
        sx={{
          zIndex: 1,
          position: "absolute",
          top: 0,
          left: 0,
          backgroundImage: `url("/assets/Blank.png")`,
          backgroundSize: "cover",
        }}
      >
        <ImageWithFallback
          src={`/order/${order.id}.png`}
          fallback={"/assets/Blank.png"}
          alt={order.name}
          width={containerSize}
          height={containerSize}
          {...option}
        />
      </Box>
    </Box>
  );
}
