import Image from 'next/image';

import {
  Container,
  Divider,
  Grid,
  List,
  Paper,
  Typography,
} from '@mui/material';

import { UpdateListItems } from '@/components/home/listItems';

export default function Home() {
  return (
    <>
      <Grid container spacing={3}>
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
            <Typography variant='h6' gutterBottom component='div'>
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
