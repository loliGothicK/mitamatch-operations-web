import { Divider, Grid2 as Grid, Paper, Typography } from '@mui/material';

import { UpdateListItems } from '@/components/home/listItems';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Grid container spacing={3}>
        <Grid size={{ xs: 6 }}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant='h6' gutterBottom component='div'>
              ようこそ Mitamatch Operations へ!
            </Typography>
            <Divider />
            <Typography variant='body1' gutterBottom>
              このサイトはアサルトリリィ Last Bullet
              のレギオンマッチをより深く楽しむためのツールがそろっています。
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
          >
            <Typography variant='h6' gutterBottom component='div'>
              Getting Started
            </Typography>
            <Divider />
            <Typography variant='body1' gutterBottom>
              使い方は
              <Link href={'/docs'}>こちら </Link>
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant='h6' gutterBottom component='div'>
              Recent Updates
            </Typography>
            <Divider />
            <UpdateListItems />
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
