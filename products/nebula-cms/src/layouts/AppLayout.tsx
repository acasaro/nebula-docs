import { Outlet, Link as RouterLink } from 'react-router';
import {
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { signOut, useCurrentUser } from '@mcoe/firebase';

export function AppLayout() {
  const auth = useCurrentUser();
  const userLabel =
    auth.status === 'authenticated' ? auth.user.email ?? auth.user.uid : '';

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}
          >
            Nebula
          </Typography>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            {userLabel ? (
              <Typography variant="body2" color="text.secondary">
                {userLabel}
              </Typography>
            ) : null}
            <Button onClick={() => signOut()} size="small">
              Sign out
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ flexGrow: 1, py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
