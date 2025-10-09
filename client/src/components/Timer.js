import { Typography } from '@mui/material';
import React from 'react';
import { useState, useEffect } from 'react';

const Timer = ({active, deadlineIntervalMs, onDeadline}) => {
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  let deadline = null

  const getTime = () => {
    if (deadline == null) {
        if (!active) { 
            setMinutes(deadlineIntervalMs / 60000);
            setSeconds(((deadlineIntervalMs % 60000) / 1000).toFixed(0));
            return
        }
        if (active) { deadline = Date.now() + deadlineIntervalMs}
    }
    const time = deadline - Date.now();
    if (time < 0) {
        onDeadline()
        setMinutes(0);
        setSeconds(0);
        return
    }
    
    setMinutes(Math.floor(time / 60000));
    setSeconds(Math.floor((time % 60000) / 1000));
  };

  useEffect(() => {
    const interval = setInterval(() => getTime(deadline), 1000);

    return () => clearInterval(interval);
  }, []);

  return (<>
  <Typography>{minutes}:{seconds}</Typography>
  </>
  );
};

export default Timer;