import * as React from 'react';

import Image from 'next/image';

import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { UpdateListItems } from '@/component/home/listItems';

export default function Home() {
  return (
    <>
      <Grid container spacing={3}>
        {/* Chart */}
        <Grid item xs={12} md={12} lg={12}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column',
              height: 320,
              backgroundColor: 'midnightblue',
            }}
          >
            <Container
              maxWidth={'xs'}
              sx={{ display: { xs: 'block', sm: 'none' } }}
            >
              <Image
                src={'/MitamaLabLogo.png'}
                alt={'logo'}
                width={300}
                height={300}
              />
            </Container>
            <Container
              maxWidth={'sm'}
              sx={{ display: { xs: 'none', sm: 'block' } }}
            >
              <Image
                src={'/MO_DARK.png'}
                alt={'logo'}
                width={900}
                height={300}
              />
            </Container>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom component="div">
              Recent Updates
            </Typography>
            <Divider />
            <List>{UpdateListItems}</List>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
