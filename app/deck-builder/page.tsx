'use client';

import React, { ReactNode, SyntheticEvent, useState } from 'react';

import { Badge, Box, Tab, Tabs, Typography } from '@mui/material';

import { DeckBuilder } from '@/app/deck-builder/_tabs/builder';
import { Calculator } from '@/app/deck-builder/_tabs/calculator';
import { Layout } from '@/component/Layout';

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function BasicTabs() {
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
          aria-label="basic tabs example"
        >
          <Tab label={'Builder'} {...a11yProps(0)} />
          <Tab
            label={
              <Badge badgeContent={'new'} color="primary">
                {'Calculator'}
              </Badge>
            }
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
