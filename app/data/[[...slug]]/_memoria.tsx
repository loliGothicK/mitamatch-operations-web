import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { TableVirtuoso, type TableComponents } from 'react-virtuoso';
import { type Memoria, memoriaList } from '@/domain/memoria/memoria';
import { Box } from '@mui/system';

interface Data {
  id: number;
  name: string;
  physicalAttack: number;
  magicalAttack: number;
  physicalDefense: number;
  magicalDefense: number;
  cost: number;
  questSkill: string;
  gvgSkill: string;
  autoSkill: string;
}

interface ColumnData {
  dataKey: keyof Data;
  label: string;
  numeric?: boolean;
  width?: number;
}

function createData(memoria: Memoria): Data {
  return {
    id: memoria.id,
    name: memoria.name.full,
    physicalAttack: memoria.status[4][0],
    magicalAttack: memoria.status[4][1],
    physicalDefense: memoria.status[4][2],
    magicalDefense: memoria.status[4][3],
    cost: memoria.cost,
    questSkill: memoria.skills.questSkill.raw.name,
    gvgSkill: memoria.skills.gvgSkill.raw.name,
    autoSkill: memoria.skills.autoSkill.raw.name,
  };
}

const columns: ColumnData[] = [
  {
    width: 100,
    label: 'Name',
    dataKey: 'name',
  },
  {
    width: 50,
    label: 'ATK',
    dataKey: 'physicalAttack',
    numeric: true,
  },
  {
    width: 50,
    label: 'Sp.ATK',
    dataKey: 'magicalAttack',
    numeric: true,
  },
  {
    width: 50,
    label: 'DEF',
    dataKey: 'physicalDefense',
    numeric: true,
  },
  {
    width: 50,
    label: 'Sp.DEF',
    dataKey: 'magicalDefense',
    numeric: true,
  },
  {
    width: 50,
    label: 'Cost',
    dataKey: 'cost',
    numeric: true,
  },
  {
    width: 130,
    label: 'Quest Skill',
    dataKey: 'questSkill',
  },
  {
    width: 130,
    label: 'GVG Skill',
    dataKey: 'gvgSkill',
  },
  {
    width: 130,
    label: 'Auto Skill',
    dataKey: 'autoSkill',
  },
];

const rows: Data[] = memoriaList.reverse().map(createData);

const VirtuosoTableComponents: TableComponents<Data> = {
  Scroller: React.forwardRef<HTMLDivElement>((props, ref) => (
    <TableContainer component={Paper} {...props} ref={ref} />
  )),
  Table: props => (
    <Table
      {...props}
      sx={{ borderCollapse: 'separate', tableLayout: 'fixed' }}
    />
  ),
  TableHead: React.forwardRef<HTMLTableSectionElement>((props, ref) => (
    <TableHead {...props} ref={ref} />
  )),
  TableRow,
  TableBody: React.forwardRef<HTMLTableSectionElement>((props, ref) => (
    <TableBody {...props} ref={ref} />
  )),
};

function fixedHeaderContent() {
  return (
    <TableRow>
      {columns.map(column => (
        <TableCell
          key={column.dataKey}
          variant='head'
          align={column.numeric || false ? 'right' : 'left'}
          style={{ width: column.width }}
          sx={{ backgroundColor: 'background.paper' }}
        >
          {column.label}
        </TableCell>
      ))}
    </TableRow>
  );
}

function rowContent(_index: number, row: Data) {
  return (
    <React.Fragment>
      {columns.map(column => (
        <TableCell
          key={column.dataKey}
          align={column.numeric || false ? 'right' : 'left'}
        >
          {row[column.dataKey]}
        </TableCell>
      ))}
    </React.Fragment>
  );
}

export function MemoriaList() {
  return (
    <Paper style={{ height: 800, width: '100%' }}>
      <TableVirtuoso
        data={rows}
        components={VirtuosoTableComponents}
        fixedHeaderContent={fixedHeaderContent}
        itemContent={rowContent}
      />
    </Paper>
  );
}

export function MemoriaDetail({ name }: { name: string }) {
  return <Box>{name}</Box>;
}
