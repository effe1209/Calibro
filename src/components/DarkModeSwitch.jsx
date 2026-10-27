import React from 'react';
import { styled } from '@mui/material/styles';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

const MaterialUISwitch = styled(Switch)(({ theme }) => ({
  width: 70,
  height: 40,
  padding: 8,
  margin: 0,
  transform: 'scale(1.12)',
  
  '& .MuiSwitch-switchBase': {
    margin: 1,
    padding: 0,
    transform: 'translateX(6px)',
    '&.Mui-checked': {
      color: '#fff',
      transform: 'translateX(26px)',
      
      // --- 1. COLORE PALLINO QUANDO È ATTIVO (NOTTE) ---
      '& .MuiSwitch-thumb': {
        backgroundColor: 'var(--ui-accent, rgba(37, 98, 126))',
      },

      '& .MuiSwitch-thumb:before': {
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
          '#ffffffff', // Ho cambiato il fill dell'icona per contrasto (opzionale)
        )}" d="M4.2 2.5l-.7 1.8-1.8.7 1.8.7.7 1.8.6-1.8L6.7 5l-1.9-.7-.6-1.8zm15 8.3a6.7 6.7 0 11-6.6-6.6 5.8 5.8 0 006.6 6.6z"/></svg>')`,
      },
      '& + .MuiSwitch-track': {
        opacity: 1,
        border: '2px solid rgba(255, 255, 255, 0.54)',
        backgroundColor: 'rgba(12, 29, 39, 0.88)',
        boxShadow: 'inset 0 1px 4px rgba(0, 0, 0, 0.36), 0 2px 7px rgba(5, 30, 41, 0.24)',
        ...theme.applyStyles('dark', {
          backgroundColor: 'rgba(6, 16, 24, 0.92)',
        }),
      },
    },
  },
  
  // --- 2. COLORE PALLINO DEFAULT (GIORNO) ---
  '& .MuiSwitch-thumb': {
    backgroundColor: 'var(--ui-accent, var(--accent-primary_DARK))',
    border: '2px solid rgba(255, 255, 255, 0.86)',
    boxShadow: '0 3px 8px rgba(6, 34, 46, 0.35)',
    width: 34,
    height: 34,
    '&::before': {
      content: "''",
      position: 'absolute',
      width: '100%',
      height: '100%',
      left: 0,
      top: 0,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
        '#000000ff',
      )}" d="M9.305 1.667V3.75h1.389V1.667h-1.39zm-4.707 1.95l-.982.982L5.09 6.072l.982-.982-1.473-1.473zm10.802 0L13.927 5.09l.982.982 1.473-1.473-.982-.982zM10 5.139a4.872 4.872 0 00-4.862 4.86A4.872 4.872 0 0010 14.862 4.872 4.872 0 0014.86 10 4.872 4.872 0 0010 5.139zm0 1.389A3.462 3.462 0 0113.471 10a3.462 3.462 0 01-3.473 3.472A3.462 3.462 0 016.527 10 3.462 3.462 0 0110 6.528zM1.665 9.305v1.39h2.083v-1.39H1.666zm14.583 0v1.39h2.084v-1.39h-2.084zM5.09 13.928L3.616 15.4l.982.982 1.473-1.473-.982-.982zm9.82 0l-.982.982 1.473 1.473.982-.982-1.473-1.473zM9.305 16.25v2.083h1.389V16.25h-1.39z"/></svg>')`,
    },
  },
  '& .MuiSwitch-track': {
    opacity: 1,
    border: '2px solid rgba(20, 87, 106, 0.38)',
    backgroundColor: 'rgba(203, 231, 238, 0.88)',
    borderRadius: 20 / 2,
    boxShadow: 'inset 0 1px 4px rgba(32, 86, 103, 0.2), 0 2px 7px rgba(19, 73, 90, 0.14)',
    ...theme.applyStyles('dark', {
      backgroundColor: 'rgba(111, 142, 154, 0.7)',
    }),
  },
}));

function DarkModeSwitch({ isDark, toggleTheme }) {
  return (
    <FormGroup style={{ alignItems: 'center', justifyContent: 'center', width: '100%' }}>
      <FormControlLabel
        control={
          <MaterialUISwitch 
            checked={isDark}
            onChange={toggleTheme}
            inputProps={{
              'aria-label': isDark ? 'Attiva modalità chiara' : 'Attiva modalità scura',
            }}
          />
        }
        label="" 
        sx={{ margin: 0, marginRight: 0 }} 
      />
    </FormGroup>
  );
}

export default DarkModeSwitch;
