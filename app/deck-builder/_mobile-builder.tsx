"use client";

import { Suspense, useState } from "react";
import {
  alpha,
  Box,
  Container,
  Drawer,
  Fab,
  IconButton,
  Tooltip,
  Divider,
  Popover,
  Alert,
} from "@mui/material";
import { Add, InfoOutlined, MoreVert } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { UserData } from "@/types/user";
import { useSearchParams, useRouter } from "next/navigation";

import {
  CalcSettings,
  DiffModal,
  QueryModal,
  QueryPresetsMenu,
  SaveDeck,
  ShareButton,
  Source,
  ToggleButtons,
  Deck,
  LegendaryDeck,
  getNextConcentration,
  updateMemoriaConcentration,
  removeMemoriaByShortName,
} from "./_tabs/builder";
import { useDeckRestore } from "./_tabs/shared-hook";
import Details from "@/components/deck-builder/Details";
import Ribbon, { RibbonGroup } from "@/components/toolbar/Toolbar";
import { Typography, Button, Stack } from "@mui/material";
import { useAtom } from "jotai";
import { rwLegendaryDeckAtom, rwDeckAtom } from "@/jotai/memoriaAtoms";
import type { MemoriaWithConcentration } from "@/jotai/memoriaAtoms";
import { MemoriaIcon } from "@/components/image/MemoriaIcon";

function DeckActionsMenu({ setDetailsDrawerOpen }: { setDetailsDrawerOpen: (v: boolean) => void }) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title="More Actions" placement="top">
        <IconButton onClick={handleClick}>
          <MoreVert />
        </IconButton>
      </Tooltip>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <Stack direction="row" spacing={1} sx={{ p: 1, alignItems: "center" }}>
          <Tooltip title="View Details" placement="top">
            <IconButton
              onClick={() => {
                setDetailsDrawerOpen(true);
                handleClose();
              }}
            >
              <InfoOutlined color="secondary" />
            </IconButton>
          </Tooltip>
          <DiffModal />
          <ShareButton />
          <SaveDeck />
          <CalcSettings />
        </Stack>
      </Popover>
    </>
  );
}

function MobileUnitComponent() {
  useDeckRestore();
  const [legendaryDeck, setLegendaryDeck] = useAtom(rwLegendaryDeckAtom);
  const [, setDeck] = useAtom(rwDeckAtom);
  const [selectedMemoria, setSelectedMemoria] = useState<MemoriaWithConcentration | null>(null);

  const handleMobileClick = (memoria: MemoriaWithConcentration) => {
    setSelectedMemoria(memoria);
  };

  const handleClose = () => {
    setSelectedMemoria(null);
  };

  const handleRemove = () => {
    if (!selectedMemoria) return;
    setDeck((prev) => removeMemoriaByShortName(prev, selectedMemoria.name.short));
    setLegendaryDeck((prev) => removeMemoriaByShortName(prev, selectedMemoria.name.short));
    handleClose();
  };

  const handleChangeConcentration = () => {
    if (!selectedMemoria) return;
    const nextConcentration = getNextConcentration(selectedMemoria.concentration);
    setDeck((prev) =>
      updateMemoriaConcentration(prev, selectedMemoria.name.short, nextConcentration),
    );
    setLegendaryDeck((prev) =>
      updateMemoriaConcentration(prev, selectedMemoria.name.short, nextConcentration),
    );
    // Update local selected state to reflect change immediately in the drawer
    setSelectedMemoria({ ...selectedMemoria, concentration: nextConcentration });
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        maxWidth: 400, // Limit width but allow enough room
      }}
    >
      {/* 伝説メモリア (5枚) */}
      <Box sx={{ width: "100%", mb: 1, px: 1 }}>
        <Typography variant="caption" color="text.secondary">
          レジェンダリーメモリア {legendaryDeck.length}/5
        </Typography>
        <LegendaryDeck size={56} layout="mobile" onMobileClick={handleMobileClick} />
      </Box>

      {/* 通常メモリア (20枚) */}
      <Box sx={{ width: "100%", px: 1 }}>
        <Divider sx={{ my: 1.5, borderBottomWidth: 2, borderColor: "divider" }} />
        <Deck size={56} layout="mobile" onMobileClick={handleMobileClick} />
      </Box>

      {/* Bottom Drawer for Action */}
      <Drawer
        anchor="bottom"
        open={Boolean(selectedMemoria)}
        onClose={handleClose}
        sx={{
          "& .MuiDrawer-paper": { borderTopLeftRadius: 16, borderTopRightRadius: 16, p: 3, pb: 5 },
        }}
      >
        {selectedMemoria && (
          <Stack spacing={3} sx={{ alignItems: "center" }}>
            <Typography variant="h6">{selectedMemoria.name.short}</Typography>
            <MemoriaIcon memoria={selectedMemoria} size={150} />
            <Stack direction="row" spacing={2} sx={{ width: "100%", mt: 2 }}>
              <Button
                variant="outlined"
                color="secondary"
                fullWidth
                size="large"
                onClick={handleChangeConcentration}
              >
                限界突破:{" "}
                {selectedMemoria.concentration === 4 ? "MAX" : selectedMemoria.concentration}
              </Button>
              <Button
                variant="contained"
                color="error"
                fullWidth
                size="large"
                onClick={handleRemove}
              >
                デッキから外す
              </Button>
            </Stack>
          </Stack>
        )}
      </Drawer>
    </Box>
  );
}

export function MobileDeckBuilder({
  signedIn,
  userData,
}: {
  signedIn: boolean;
  userData: UserData | undefined;
}) {
  const theme = useTheme();
  const [sourceDrawerOpen, setSourceDrawerOpen] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const canPersistQueryPresets = !!userData;
  const params = useSearchParams();
  const router = useRouter();
  const deckParam = params.get("deck");

  return (
    <Box sx={{ pb: 10 }}>
      {deckParam && (
        <Alert
          severity="info"
          sx={{ width: "100%", mb: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                const titleParam = params.get("title");
                router.replace(titleParam ? `/deck-builder?title=${titleParam}` : "/deck-builder");
              }}
            >
              コピーして編集
            </Button>
          }
        >
          共有されたデッキを表示しています。変更は共有リンクに反映されます。「コピーして編集」をクリックすると新しいデッキとして独立して編集できます。
        </Alert>
      )}
      {/* Ribbon Toolbar */}
      <Box data-tour="deck-toolbar" sx={{ width: "100%", overflowX: "auto" }}>
        <Ribbon>
          <RibbonGroup>
            <ToggleButtons />
          </RibbonGroup>
          <RibbonGroup label={"Query"}>
            <QueryModal signedIn={signedIn} canPersist={canPersistQueryPresets} />
            <QueryPresetsMenu signedIn={signedIn} canPersist={canPersistQueryPresets} />
          </RibbonGroup>
          <RibbonGroup label={"More"}>
            <DeckActionsMenu setDetailsDrawerOpen={setDetailsDrawerOpen} />
          </RibbonGroup>
        </Ribbon>
      </Box>

      {/* Main Canvas (Unit) */}
      <Container
        data-tour="deck-unit"
        maxWidth={false}
        disableGutters
        sx={{
          bgcolor:
            theme.palette.mode === "dark"
              ? "rgba(255,255,255, 0.1)"
              : alpha(theme.palette.primary.main, 0.2),
          minHeight: "80vh",
          paddingTop: 2,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Suspense>
          <MobileUnitComponent />
        </Suspense>
      </Container>

      {/* Floating Action Button for Source */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: theme.zIndex.speedDial,
        }}
        onClick={() => setSourceDrawerOpen(true)}
      >
        <Add />
      </Fab>

      {/* Drawer for Source */}
      <Drawer
        anchor="bottom"
        open={sourceDrawerOpen}
        onClose={() => setSourceDrawerOpen(false)}
        sx={{
          "& .MuiDrawer-paper": {
            height: "80vh",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            p: 2,
            boxSizing: "border-box",
          },
        }}
      >
        <Box data-tour="deck-source" sx={{ height: "100%", overflowY: "auto", pt: 2 }}>
          <Source />
        </Box>
      </Drawer>

      {/* Drawer for Details */}
      <Drawer
        anchor="bottom"
        open={detailsDrawerOpen}
        onClose={() => setDetailsDrawerOpen(false)}
        sx={{
          "& .MuiDrawer-paper": {
            height: "60vh",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            p: 2,
            boxSizing: "border-box",
          },
        }}
      >
        <Box
          data-tour="deck-details"
          sx={{ height: "100%", overflowY: "auto", display: "flex", justifyContent: "center" }}
        >
          <Details />
        </Box>
      </Drawer>
    </Box>
  );
}
