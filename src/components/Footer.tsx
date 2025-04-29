import GitHubIcon from '@mui/icons-material/GitHub';
import TwitterIcon from '@mui/icons-material/Twitter';
import { Box, Container, Divider, Grid, Stack } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import Image from 'next/image';

export default function Footer({ ...props }) {
  const theme = useTheme();
  const content = {
    copy: `Copyright © Mitama Lab. ${new Date().getFullYear()}`,
    tools: [
      {
        content: 'deck builder',
        href: '/deck-builder',
      },
      {
        content: 'timeline builder',
        href: '/timeline-builder',
      },
      {
        content: 'flowchart',
        href: '/flowchart',
      },
    ],
    ...props,
  };

  return (
    <Container
      sx={{ bgcolor: theme.palette.background.paper, minWidth: '100vw' }}
    >
      <footer>
        <Box
          sx={{
            display: 'grid',
            gap: 10,
            margin: 4,
            justifyContent: 'center',
            alignItems: 'center',
            GridTemplateColumns: '1fr 1fr',
            GridTemplateRows: '1fr 1fr',
            GridTemplateAreas: `
            "logo tools"
            "donate docs"
          `,
          }}
        >
          <Box sx={{ GridArea: 'logo' }}>
            <Stack justifyContent='center' alignItems='center'>
              <Image
                src={
                  theme.palette.mode === 'dark'
                    ? '/MO_DARK.png'
                    : '/MO_LIGHT.png'
                }
                alt={'mode'}
                width={300}
                height={100}
              />
              <Typography>
                {'一瞬でレギオンマッチを改善。驚きの速さで。'}
              </Typography>
            </Stack>
          </Box>
          <Box sx={{ gridArea: 'docs' }}>
            <Stack justifyContent='center' alignItems='center'>
              <Typography>{'Docs'}</Typography>
              {['deck-builder', 'timeline-builder', 'flowchart'].map(link => (
                <Link
                  href={`/docs/${link}`}
                  variant='body1'
                  color={theme.palette.text.secondary}
                  key={link}
                >
                  {link}
                </Link>
              ))}
            </Stack>
          </Box>
          <Box sx={{ GridArea: 'tools' }}>
            <Stack justifyContent='center' alignItems='center'>
              <Typography>{'Tools'}</Typography>
              {content.tools.map(link => {
                return (
                  <Link
                    href={link.href}
                    variant='body1'
                    color={theme.palette.text.secondary}
                    key={link.content}
                  >
                    {link.content}
                  </Link>
                );
              })}
            </Stack>
          </Box>
          <Box sx={{ GridArea: 'donate' }}>
            <Stack justifyContent='center' alignItems='center'>
              <Typography>{'Donate'}</Typography>
              <Link
                href={'https://www.paypal.me/loligothick'}
                target={'_blank'}
                color={theme.palette.text.secondary}
              >
                <Typography>{'PayPal'}</Typography>
              </Link>
              <Link
                href='https://github.com/sponsors/loliGothicK?o=esb'
                aria-label='Sponsor @loliGothicK'
                target='_blank'
              >
                <span
                  className='Button-content'
                  style={{
                    alignItems: 'center',
                    display: 'grid',
                    flex: '1 0 auto',
                    gridTemplateAreas: '"leadingVisual text trailingVisual"',
                    gridTemplateColumns:
                      'min-content minmax(0, auto) min-content',
                    placeContent: 'center',
                  }}
                >
                  <span
                    style={{ marginRight: '0.5rem', gridArea: 'leadingVisual' }}
                  >
                    <svg
                      fill={theme.palette.primary.dark}
                      aria-hidden='true'
                      height='16'
                      viewBox='0 0 16 16'
                      version='1.1'
                      width='16'
                      data-view-component='true'
                      style={{
                        gridArea: 'text',
                        display: 'flex',
                      }}
                    >
                      <path d='m8 14.25.345.666a.75.75 0 0 1-.69 0l-.008-.004-.018-.01a7.152 7.152 0 0 1-.31-.17 22.055 22.055 0 0 1-3.434-2.414C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.045 5.231-3.885 6.818a22.066 22.066 0 0 1-3.744 2.584l-.018.01-.006.003h-.002ZM4.25 2.5c-1.336 0-2.75 1.164-2.75 3 0 2.15 1.58 4.144 3.365 5.682A20.58 20.58 0 0 0 8 13.393a20.58 20.58 0 0 0 3.135-2.211C12.92 9.644 14.5 7.65 14.5 5.5c0-1.836-1.414-3-2.75-3-1.373 0-2.609.986-3.029 2.456a.749.749 0 0 1-1.442 0C6.859 3.486 5.623 2.5 4.25 2.5Z' />
                    </svg>
                  </span>
                  <span
                    className='Button-label'
                    style={{
                      color: theme.palette.text.secondary,
                    }}
                  >
                    Sponsor
                  </span>
                </span>
              </Link>
            </Stack>
          </Box>
        </Box>
        <Divider sx={{ margin: 2, width: '100%' }} />
        <Grid container direction={'row'} sx={{ paddingBottom: 10 }}>
          <Grid flexGrow={0.9}>
            <Typography
              color={theme.palette.text.secondary}
              component='p'
              variant='body2'
              gutterBottom={false}
            >
              {content.copy}
            </Typography>
            <Typography
              color={theme.palette.text.secondary}
              component='p'
              variant='body2'
              gutterBottom={false}
            >
              All copyrights (images, text, data, etc.) on this website are
              owned by ©AZONE INTERNATIONAL and acus/アサルトリリィプロジェクト.
            </Typography>
          </Grid>
          <Grid>
            <IconButton
              aria-label='Twitter'
              sx={{ color: theme.palette.text.secondary }}
              onClick={() => window.open('https://twitter.com/mitama_rs')}
            >
              <TwitterIcon />
            </IconButton>
            <IconButton
              aria-label='GitHub'
              sx={{ color: theme.palette.text.secondary }}
              onClick={() => window.open('https://github.com/loliGothicK')}
            >
              <GitHubIcon />
            </IconButton>
          </Grid>
        </Grid>
      </footer>
    </Container>
  );
}
