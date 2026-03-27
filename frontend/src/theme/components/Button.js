export const Button = {
  defaultProps: {
    disableElevation: true,
  },
  styleOverrides: {
    root: {
      borderRadius: 8,
    },
    containedPrimary: {
      backgroundColor: '#9C27B0',
      color: '#FFFFFF',
      '&:hover': {
        backgroundColor: '#7B1FA2',
      },
      '&.Mui-disabled': {
        backgroundColor: '#9C27B080',
        color: '#FFFFFFB2',
      },
    },
    textPrimary: {
      color: '#9C27B0',
      '&:hover': {
        backgroundColor: '#9C27B014',
      },
    },
  },
};
