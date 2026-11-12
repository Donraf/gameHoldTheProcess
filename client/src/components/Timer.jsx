import { Typography } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { millisToMinutesAndSeconds } from "../utils/getTimeDiff";

const Timer = ({ active, deadlineIntervalMs, onDeadline, textClr = "#000000" }) => {
  const [curTime, setCurTime] = useState(deadlineIntervalMs);
  const deadlineRef = useRef(null);

  useEffect(() => {
    deadlineRef.current = null;
    if (!active) {
      setCurTime(deadlineIntervalMs);
    }
  }, [active, deadlineIntervalMs]);

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    if (deadlineRef.current == null) {
      deadlineRef.current = Date.now() + deadlineIntervalMs;
    }

    const tick = () => {
      const time = deadlineRef.current - Date.now();
      if (time < 0) {
        onDeadline();
        setCurTime(0);
        return;
      }
      setCurTime(time);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [active, deadlineIntervalMs, onDeadline]);

  return (
    <Typography sx={{ color: textClr }}>{millisToMinutesAndSeconds(curTime)}</Typography>
  );
};

export default Timer;
