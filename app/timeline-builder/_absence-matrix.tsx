import React from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from "@mui/material";
import { useAtomValue } from "jotai";
import { timelineAtom } from "@/jotai/orderAtoms";

export const AbsenceMatrixDialog = ({
  open,
  onClose,
  pendingShift,
  onConfirm
}: {
  open: boolean;
  onClose: () => void;
  pendingShift: { picShift: string[]; subPicShift: string[] } | null;
  onConfirm: () => void;
}) => {
  const timeline = useAtomValue(timelineAtom);

  if (!pendingShift) return null;
  const { picShift, subPicShift } = pendingShift;

  // Get unique assigned members from PIC and Sub PIC
  const assignedMembers = Array.from(
    new Set([
      ...picShift.filter(Boolean),
      ...subPicShift.filter(Boolean),
    ])
  ).sort();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>欠席パターン別 担当マトリクス</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          各メンバーが欠席した場合に、誰がどのオーダーを担当するかを示すマトリクスです。
          <br />
          (設定されているPICが欠席の場合、Sub PICが代行します。赤字は担当者不在です)
        </Typography>
        <TableContainer component={Paper}>
          <Table size="small" sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>欠席者 / オーダー</TableCell>
                {timeline.map((order, i) => (
                  <TableCell key={order.id} sx={{ whiteSpace: "nowrap" }}>
                    {i + 1}. {order.name}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Pattern 0: All Present */}
              <TableRow>
                <TableCell component="th" scope="row" sx={{ fontWeight: "bold" }}>
                  全員出席
                </TableCell>
                {timeline.map((order, i) => (
                  <TableCell key={order.id}>
                    {picShift[i] || <span style={{ color: "red" }}>未設定</span>}
                  </TableCell>
                ))}
              </TableRow>
              
              {/* Patterns 1..N: Each assigned member is absent */}
              {assignedMembers.map((absentMember) => (
                <TableRow key={absentMember}>
                  <TableCell component="th" scope="row">
                    {absentMember} 欠席
                  </TableCell>
                  {timeline.map((order, i) => {
                    const isPicAbsent = picShift[i] === absentMember;
                    const activeCaster = isPicAbsent ? subPicShift[i] : picShift[i];
                    const isFailed = !activeCaster || activeCaster === absentMember;
                    
                    return (
                      <TableCell 
                        key={order.id}
                        sx={{ 
                          color: isFailed ? "error.main" : (isPicAbsent ? "warning.main" : "text.primary"),
                          fontWeight: isPicAbsent && !isFailed ? "bold" : "normal",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {isFailed ? "割当不可" : activeCaster}
                        {isPicAbsent && !isFailed && " (Sub)"}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={onConfirm} variant="contained" color="primary">この割り当てを適用する</Button>
      </DialogActions>
    </Dialog>
  );
};
