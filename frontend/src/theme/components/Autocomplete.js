import React from 'react';
import { DownArrow } from './DownArrow';

export const Autocomplete = {
  styleOverrides: {
    root: {
      '& .MuiAutocomplete-popupIndicator': {
        transform: 'rotate(0deg)',
        transition: 'transform 0.3s ease',
      },
      '& .MuiAutocomplete-popupIndicatorOpen': {
        transform: 'rotate(180deg)',
      },
    },
  },
  defaultProps: {
    popupIcon: React.createElement(DownArrow),
  },
};
