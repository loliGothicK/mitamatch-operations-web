import { FormEvent, MouseEvent, useState } from 'react';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Menu,
  MenuItem,
  TextField,
} from '@mui/material';

import { EdgeLabelRenderer, EdgeProps, getBezierPath } from 'reactflow';

export default function LabeledEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  style,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const handleContextMenu = (event: MouseEvent<SVGPathElement>) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
          }
        : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
          // Other native context menus might behave different.
          // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
          null,
    );
  };

  return (
    <>
      <path
        d={edgePath}
        className="react-flow__edge-path"
        style={{
          ...style,
          stroke: 'transparent',
          cursor: 'pointer',
          strokeWidth: 10,
        }} // 透明に設定
        // ここに必要なイベントハンドラを追加
        onContextMenu={handleContextMenu}
      />
      <path // 実際の線
        id={id}
        d={edgePath}
        className="react-flow__edge-path"
        markerEnd={markerEnd}
        style={{ ...style, stroke: 'dimgrey' }}
      />
      <EdgeLabelRenderer>
        <Button
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            color: 'dimgrey',
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
            display: comment !== '' ? 'block' : 'none',
          }}
          disabled={true}
          onClick={() => setDialogOpen(true)}
        >
          {comment}
        </Button>
      </EdgeLabelRenderer>
      <Menu
        open={contextMenu !== null}
        onClose={() => setContextMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem
          onClick={() => {
            setContextMenu(null);
            setDialogOpen(true);
          }}
        >
          コメントを編集
        </MenuItem>
      </Menu>
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        PaperProps={{
          component: 'form',
          onSubmit: (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const formJson = Object.fromEntries((formData as any).entries());
            setComment(formJson.comment);
            setDialogOpen(false);
          },
        }}
      >
        <DialogContent>
          <TextField
            autoFocus
            required
            margin="dense"
            id="comment"
            name="comment"
            label="コメント"
            fullWidth
            variant="standard"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            type="submit"
            onClick={() => {
              setComment('');
              setDialogOpen(false);
            }}
          >
            Delete
          </Button>
          <Button type="submit">Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
