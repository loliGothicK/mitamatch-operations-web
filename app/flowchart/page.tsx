'use client';

import React, { useCallback, useMemo, useState } from 'react';

import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

import { Add } from '@mui/icons-material';
import { Autocomplete, Button, Modal, Stack, TextField } from '@mui/material';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { LabeledEdge } from '@/component/flow/Edge';
import OrderNode from '@/component/flow/node/OrderNode';
import { Layout } from '@/component/Layout';
import { Order, orderList } from '@/domain/order/order';
import { Node } from '@/types/flow/node';

import ReactFlow, {
  addEdge,
  Background,
  BackgroundVariant,
  Connection,
  Edge,
  MiniMap,
  Node as NodeType,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

const nodeStorageAtom = atomWithStorage('flowchart-nodes', [] as NodeType[]);
const edgeStorageAtom = atomWithStorage('flowchart-edges', [] as Edge[]);
const counterAtom = atomWithStorage('counter', 0);

export default function FlowChart() {
  const [counter, setCounter] = useAtom(counterAtom);
  const [initNodes, setNodeStorage] = useAtom(nodeStorageAtom);
  const [initEdges, setEdgeStorage] = useAtom(edgeStorageAtom);
  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);
  const [modalOpen, setModalOpen] = useState(false);

  const getCounter = () => {
    setCounter((c) => c + 1);
    return counter;
  };

  const onConnect = useCallback(
    (connection: Connection) => {
      const edge = { ...connection, type: 'labeld-edge' };
      setEdges((eds) => addEdge(edge, eds));
      setEdgeStorage((eds) => addEdge(edge, eds));
    },
    [setEdges],
  );

  const nodeTypes = useMemo(() => ({ order: OrderNode }), []);
  const edgeTypes = useMemo(() => ({ 'labeld-edge': LabeledEdge }), []);

  const [select, setSelect] = useState<Order>(orderList[0]);

  return (
    <Layout>
      <Grid
        container
        direction={'row'}
        alignItems={'center'}
        sx={{ height: '10vh' }}
      >
        <Stack direction={'row'} display={'flex'}>
          <Stack direction={'row'}>
            <Autocomplete
              disablePortal
              options={orderList
                .filter((order) => order.payed)
                .map((order) => order.name)}
              sx={{ width: 250 }}
              renderInput={(params) => (
                <TextField {...params} label="Select Order" />
              )}
              onChange={(_, value) => {
                if (value) {
                  setSelect(orderList.find((order) => order.name === value)!);
                }
              }}
            />
            <IconButton
              onClick={() => {
                const newNodes = [
                  ...nodes,
                  {
                    id: getCounter().toString(),
                    type: 'order',
                    position: { x: 100, y: 100 },
                    data: { order: select },
                  },
                ];
                setNodeStorage(newNodes);
                setNodes(newNodes);
              }}
            >
              <Add />
            </IconButton>
          </Stack>
          <Stack
            direction={'row'}
            position={'absolute'}
            right={100}
            onClick={() => setModalOpen(true)}
          >
            <Button>{'how to use'}</Button>
          </Stack>
        </Stack>
      </Grid>
      <Divider />
      <div
        style={{
          width: '85vw',
          height: '80vh',
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onConnect={onConnect}
          onNodeDragStop={(_, node) => {
            setNodeStorage((prev) => {
              const idx = prev.findIndex((n) => n.id === node.id);
              prev[idx] = node;
              return prev;
            });
          }}
        >
          <Background color="grey" variant={BackgroundVariant.Dots} />
          <MiniMap nodeStrokeWidth={3} zoomable pannable />
        </ReactFlow>
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 500,
            bgcolor: 'background.paper',
            border: '2px solid #000',
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Flowchart の使い方
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            1. オーダーを選択して追加ボタンを押す
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            2. ノードをドラッグして移動
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            3. ノードのハンドルをドラッグしてエッジを作成
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            4. ノードまたはエッジをクリックして Backspace を押すと削除
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            5. ノードまたはエッジを右クリックすると編集メニューが表示
          </Typography>
        </Box>
      </Modal>
    </Layout>
  );
}
