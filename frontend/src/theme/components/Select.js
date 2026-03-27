import { DownArrow } from './DownArrow';

export const Select = {
  styleOverrides: {
    root: {
      borderRadius: 8,
      '& .MuiSelect-icon': {
        top: '50%',
        right: 10,
        position: 'absolute',
        transform: 'translateY(-50%) rotate(0deg)',
        transition: 'transform 0.3s ease',
      },
      '& .MuiSelect-iconOpen': {
        transform: 'translateY(-50%) rotate(180deg)',
      },
    },
  },
  defaultProps: {
    IconComponent: DownArrow,
  },
};
