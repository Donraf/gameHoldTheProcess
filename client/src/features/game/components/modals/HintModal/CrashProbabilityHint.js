import React from "react";
import { Button, Typography } from "@mui/material";

const noSelectSx = { userSelect: "none" };
const backButtonSx = {
  color: "#FFFFFF",
  backgroundColor: "#9356A0",
  flexGrow: 1,
};

export default function CrashProbabilityHint({ crashProb, hintModalDataFetched, onBack }) {
  if (!hintModalDataFetched) {
    return (
      <Typography sx={noSelectSx}>Расчет вероятности...</Typography>
    );
  }

  return (
    <>
      <Typography sx={noSelectSx}>{crashProb}</Typography>
      <Button sx={backButtonSx} onClick={onBack}>
        Назад
      </Button>
    </>
  );
}
