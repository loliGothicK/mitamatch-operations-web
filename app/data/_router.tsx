'use client';

import { MemoriaList } from '@/data/_memoria/memoria';
import { Layout } from '@/components/Layout';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { useSearchParams } from 'next/navigation';
import { type ReactNode, type SyntheticEvent, useState } from 'react';
import { match } from 'ts-pattern';

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const TABS = [
  {
    label: 'Memoria',
    content: (query?: string) => <MemoriaList initialQuery={query} />,
    disabled: false,
  },
  {
    label: 'Order',
    content: (query?: string) => <MemoriaList initialQuery={query} />,
    disabled: true,
  },
  {
    label: 'Costume',
    content: (query?: string) => <MemoriaList initialQuery={query} />,
    disabled: true,
  },
];

export default function DataPage({ dataType }: { dataType?: string }) {
  const searchParams = useSearchParams();
  const query = searchParams.get('query') || undefined;

  const [value, setValue] = useState(
    match(dataType)
      .with('memoria', () => 0)
      .with('order', () => 1)
      .with('costume', () => 2)
      .otherwise(() => 0),
  );

  const handleChange = (_: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Layout>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label='basic tabs example'
          >
            {TABS.map((def, index) => (
              <Tab
                key={def.label}
                label={def.label}
                {...a11yProps(index)}
                disabled={def.disabled}
              />
            ))}
          </Tabs>
        </Box>
        {TABS.map((tab, index) => (
          <CustomTabPanel index={index} value={value} key={tab.label}>
            {tab.content(query)}
          </CustomTabPanel>
        ))}
      </Box>
    </Layout>
  );
}
