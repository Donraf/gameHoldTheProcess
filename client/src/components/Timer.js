import { Typography } from "@mui/material";
import React from "react";
import { useState, useEffect } from "react";
import { millisToMinutesAndSeconds } from "../utils/getTimeDiff";

const Timer = ({ active, deadlineIntervalMs, onDeadline, textClr="#000000" }) => {
  const [curTime, setCurTime] = useState(0);

  let deadline = null;

  const getTime = () => {
    if (deadline == null) {
      if (!active) {
        setCurTime(deadlineIntervalMs);
        return;
      }
      if (active) {
        deadline = Date.now() + deadlineIntervalMs;
      }
    }
    const time = deadline - Date.now();
    if (time < 0) {
      onDeadline();
      setCurTime(0);
      return;
    }

    setCurTime(time);
  };

  useEffect(() => {
    const interval = setInterval(() => getTime(deadline), 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Typography sx={{color: textClr}}>
        {millisToMinutesAndSeconds(curTime)}
      </Typography>
    </>
  );
};

export default Timer;
