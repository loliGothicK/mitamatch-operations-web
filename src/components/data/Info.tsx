import { InfoOutlined } from "@mui/icons-material";
import { Typography } from "@mui/material";
import { Box } from "@mui/system";
import { PropsWithChildren, ReactNode } from "react";

export default function Info({
  icon,
  margin,
  children,
}: PropsWithChildren<{ icon?: ReactNode; margin?: number }>) {
  return (
    <Box
      sx={{
        margin: margin,
        color: "text.primary",
        py: 2,
        display: "flex",
        alignItems: "start",
        gap: 2,
      }}
    >
      {icon || <InfoOutlined color="primary" />}
      <Box>
        <Typography variant="subtitle2" fontWeight="bold">
          {children}
        </Typography>
      </Box>
    </Box>
  );
}
