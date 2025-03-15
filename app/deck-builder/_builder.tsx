'use client';

import { DeckBuilder } from '@/deck-builder/_tabs/builder';
import { Calculator } from '@/deck-builder/_tabs/calculator';
import { Layout } from '@/components/Layout';
import { Box, Tab, Tabs } from '@mui/material';
import { type ReactNode, type SyntheticEvent, useState } from 'react';

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

export function DeckBuilderPage() {
  const [value, setValue] = useState(0);

  const handleChange = (_: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Layout>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label='basic tabs example'
        >
          <Tab label={'Builder'} {...a11yProps(0)} />
          <Tab
            label={'Calculator'}
            {...a11yProps(1)}
            sx={{ paddingRight: 5 }}
          />
        </Tabs>
      </Box>
      <CustomTabPanel value={value} index={0}>
        <DeckBuilder />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        <Calculator />
      </CustomTabPanel>
    </Layout>
  );
}
