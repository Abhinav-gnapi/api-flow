import { createTheme } from '@mui/material/styles';
import { Palette, OnionComponentTheme } from './palette';
import { Typography } from './typography';
import { ComponentOverrides } from './components';

export const muiTheme = createTheme({
  palette: Palette,
  typography: Typography,
  components: ComponentOverrides,
  ...OnionComponentTheme,
});
