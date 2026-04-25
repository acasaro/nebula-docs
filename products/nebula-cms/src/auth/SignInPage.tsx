import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { signInWithGoogle, signInWithEmail, useCurrentUser } from '@mcoe/firebase';
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

interface LocationState {
  from?: string;
}

export function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useCurrentUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (auth.status === 'authenticated') {
    const target = (location.state as LocationState)?.from ?? '/';
    navigate(target, { replace: true });
    return null;
  }

  const handleGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signInWithEmail(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Stack spacing={4} sx={{ alignItems: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Nebula CMS
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to manage docs content
          </Typography>
        </Box>

        {error ? <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert> : null}

        <Button
          variant="outlined"
          size="large"
          onClick={handleGoogle}
          disabled={busy}
          sx={{ width: '100%' }}
        >
          Sign in with Google
        </Button>

        <Divider sx={{ width: '100%' }}>or</Divider>

        <Stack
          component="form"
          spacing={2}
          sx={{ width: '100%' }}
          onSubmit={handleEmail}
        >
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={busy}
            fullWidth
          >
            Sign in
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
