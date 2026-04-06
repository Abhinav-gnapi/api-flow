import React from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { AppShell } from './App';
import { applyTypography } from './theme/applyTypography';
import { muiTheme } from './theme/muiTheme';

// Ensure design tokens are initialized when this app is mounted remotely.
applyTypography();

export default function LegacyFrontend() {
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <AppShell router="memory" initialEntries={['/']} />
    </ThemeProvider>
  );
}
