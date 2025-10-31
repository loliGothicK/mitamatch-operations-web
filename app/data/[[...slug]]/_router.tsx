'use client';

import { use } from 'react';
import { match, P } from 'ts-pattern';
import NotFound from 'next/dist/client/components/builtin/not-found';
import { MemoriaDetail, MemoriaList } from '@/data/[[...slug]]/_memoria';
import { Layout } from '@/components/Layout';
import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

interface TabPanelProps {
  children?: React.ReactNode;
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

export default function DataPage({
  params,
}: {
  params: Promise<{ slug: string | string[] | undefined }>;
}) {
  const { slug } = use(params);

  if (typeof slug === 'string') {
    // list page
    return match(slug)
      .with('memoria', () => <MemoriaList />)
      .otherwise(() => <NotFound />);
  } else if (Array.isArray(slug)) {
    // detail page
    return match(slug)
      .with(['memoria', P.string], ([_, name]) => <MemoriaDetail name={name} />)
      .otherwise(() => <NotFound />);
  } else if (slug === undefined) {
    // top page
    return <MainFrame />;
  } else {
    return <NotFound />;
  }
}

const TABS = [
  {
    label: 'Memoria',
    content: <MemoriaList />,
    disabled: false,
  },
  {
    label: 'Order',
    content: <></>,
    disabled: true,
  },
  {
    label: 'Costume',
    content: <></>,
    disabled: true,
  },
];

function MainFrame() {
  const [value, setValue] = React.useState(0);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
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
            {TABS.map((tab, index) => (
              <Tab
                key={tab.label}
                label={tab.label}
                {...a11yProps(index)}
                disabled={tab.disabled}
              />
            ))}
          </Tabs>
        </Box>
        {TABS.map((tab, index) => (
          <CustomTabPanel index={index} value={index} key={tab.label}>
            {tab.content}
          </CustomTabPanel>
        ))}
      </Box>
    </Layout>
  );
}
