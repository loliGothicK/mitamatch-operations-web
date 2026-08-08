"use client";

import { useAtom } from "jotai";
import { useState, useMemo } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Snackbar,
  Tooltip,
  IconButton,
} from "@mui/material";
import { AutoAwesome } from "@mui/icons-material";
import { timelineAtom } from "@/jotai/orderAtoms";
import { UserData } from "@/types/user";
import { assignOrders, getMemberName, Member } from "./autoAssign";
import { AbsenceMatrixDialog } from "./_absence-matrix";

export function AutoAssignButton({ userData }: { userData?: UserData }) {
  const [timeline, setTimeline] = useAtom(timelineAtom);
  const [open, setOpen] = useState(false);
  const [selectedLegionId, setSelectedLegionId] = useState<string>("");
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [rearGuard, setRearGuard] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [resultMatrixOpen, setResultMatrixOpen] = useState(false);
  const [pendingShift, setPendingShift] = useState<{
    picShift: string[];
    subPicShift: string[];
  } | null>(null);

  const validLegions = useMemo(() => {
    return (userData?.legions || []).filter((l) => l.members && l.members.length === 9);
  }, [userData]);

  const handleOpen = () => {
    if (validLegions.length > 0) {
      setSelectedLegionId(validLegions[0].id);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleToggleWhitelist = (memberName: string) => {
    setWhitelist((prev) =>
      prev.includes(memberName) ? prev.filter((m) => m !== memberName) : [...prev, memberName],
    );
  };

  const handleToggleRearGuard = (memberName: string) => {
    setRearGuard((prev) =>
      prev.includes(memberName) ? prev.filter((m) => m !== memberName) : [...prev, memberName],
    );
  };

  const handleExecute = () => {
    const legion = validLegions.find((l) => l.id === selectedLegionId);
    if (!legion || !legion.members) return;

    const members = legion.members as Member[];
    const { picShift, subPicShift } = assignOrders(timeline, members, whitelist, rearGuard);

    if (!picShift || !subPicShift) {
      setToastMessage("条件を満たす割り当てが見つかりませんでした");
    } else {
      // 一時的に結果を保持し、マトリクスダイアログを開く (適用はまだしない)
      setPendingShift({ picShift, subPicShift });
      setOpen(false);
      setResultMatrixOpen(true);
    }
  };

  const handleConfirm = () => {
    if (!pendingShift) return;
    setTimeline((prev) =>
      prev.map((order, i) => ({
        ...order,
        pic: pendingShift.picShift[i],
        sub: pendingShift.subPicShift[i],
      })),
    );
    setToastMessage("割り当てを完了しました");
    setResultMatrixOpen(false);
  };

  if (validLegions.length === 0) return null;

  const currentLegion = validLegions.find((l) => l.id === selectedLegionId);
  const members = (currentLegion?.members || []) as Member[];

  return (
    <>
      <Tooltip title="Auto Assign">
        <IconButton onClick={handleOpen}>
          <AutoAwesome />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>PIC / Sub PIC 自動割り当て</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            タイムラインのオーダーに対する PIC と Sub PIC を自動で計算し割り当てます。
          </DialogContentText>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="legion-select-label">対象レギオン</InputLabel>
            <Select
              labelId="legion-select-label"
              value={selectedLegionId}
              label="対象レギオン"
              onChange={(e) => setSelectedLegionId(e.target.value)}
            >
              {validLegions.map((legion) => (
                <MenuItem key={legion.id} value={legion.id}>
                  {legion.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <DialogContentText sx={{ mb: 1, fontWeight: "bold" }}>
            payed: false (無課金) オーダーでの代用許可 (ホワイトリスト)
          </DialogContentText>
          <FormGroup row>
            {members.map((m) => {
              const name = getMemberName(m);
              return (
                <FormControlLabel
                  key={name}
                  control={
                    <Checkbox
                      checked={whitelist.includes(name)}
                      onChange={() => handleToggleWhitelist(name)}
                    />
                  }
                  label={name}
                />
              );
            })}
          </FormGroup>
          <DialogContentText sx={{ mb: 1, fontWeight: "bold", mt: 3 }}>
            後衛 (Rear-guard) 指定
          </DialogContentText>
          <FormGroup row>
            {members.map((m) => {
              const name = getMemberName(m);
              return (
                <FormControlLabel
                  key={`rear-${name}`}
                  control={
                    <Checkbox
                      checked={rearGuard.includes(name)}
                      onChange={() => handleToggleRearGuard(name)}
                    />
                  }
                  label={name}
                />
              );
            })}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>キャンセル</Button>
          <Button onClick={handleExecute} variant="contained" color="primary">
            実行
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        autoHideDuration={3000}
        open={!!toastMessage}
        onClose={() => setToastMessage("")}
        message={toastMessage}
      />
      <AbsenceMatrixDialog
        open={resultMatrixOpen}
        onClose={() => setResultMatrixOpen(false)}
        pendingShift={pendingShift}
        onConfirm={handleConfirm}
      />
    </>
  );
}
