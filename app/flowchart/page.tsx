'use client';

import React, { useCallback, useMemo, useState } from 'react';

import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

import { Add } from '@mui/icons-material';
import { Autocomplete, TextField } from '@mui/material';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';

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
    </Layout>
  );
}
