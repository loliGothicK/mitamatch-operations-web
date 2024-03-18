import GitHubIcon from "@mui/icons-material/GitHub";
import TwitterIcon from "@mui/icons-material/Twitter";
import { Container } from "@mui/material";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { styled, useTheme } from "@mui/material/styles";

const FooterBox = styled(Box)(({ theme }) => ({
  footerNav: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: theme.spacing(1),
  },
  footerLink: {
    marginLeft: theme.spacing(3),
    marginRight: theme.spacing(3),
    marginBottom: theme.spacing(2),
  },
}));

export default function Footer({ ...props }) {
  const theme = useTheme();
  const content = {
    copy: `Copyright © Mitama Lab. ${new Date().getFullYear()}`,
    links: [
      {
        content: "top",
        href: "/",
      },
    ],
    ...props,
  };

  return (
    <Container sx={{ bgcolor: theme.palette.primary.main, minWidth: "100vw" }}>
      <footer>
        <Box py={6} textAlign="center">
          <FooterBox component="nav">
            {content.links.map((link) => {
              return (
                <Link
                  href={`${link.href}`}
                  variant="body1"
                  color={theme.palette.text.secondary}
                  key={link.content}
                  sx={{ m: 3 }}
                >
                  {link.content}
                </Link>
              );
            })}
          </FooterBox>
          <Box mb={3}>
            <IconButton
              aria-label="Twitter"
              sx={{ color: theme.palette.text.secondary }}
            >
              <TwitterIcon />
            </IconButton>
            <IconButton
              aria-label="GitHub"
              sx={{ color: theme.palette.text.secondary }}
            >
              <GitHubIcon />
            </IconButton>
          </Box>
          <Typography
            color={theme.palette.text.secondary}
            component="p"
            variant="body2"
            gutterBottom={false}
          >
            {content["copy"]}
          </Typography>
          <Typography
            color={theme.palette.text.secondary}
            component="p"
            variant="body2"
            gutterBottom={false}
          >
            All copyrights (images, text, data, etc.) on this website are owned
            by ©AZONE INTERNATIONAL and acus/アサルトリリィプロジェクト.
          </Typography>
        </Box>
      </footer>
    </Container>
  );
}
