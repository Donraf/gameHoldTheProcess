import React from "react";
import { Button, Typography } from "@mui/material";
import { COLORS } from "../../../../../utils/constants";

const noSelectSx = { userSelect: "none" };
const backButtonSx = {
  color: "#FFFFFF",
  backgroundColor: "#9356A0",
  flexGrow: 1,
};

export default function HintMenu({ hintCost, onSelectCrashProbability, onClose }) {
  return (
    <>
      <Typography sx={noSelectSx}>Какую подсказку хотите купить?</Typography>
      {/* <Button
        sx={{
          color: "#FFFFFF",
          backgroundColor: COLORS.takeHintButton,
          flexGrow: 1,
        }}
        onClick={() => {
          setChosenHint("CurrentSession");
          chart.chartData.chartHintUsed(50);
          changeScore(-50);
        }}
      >
        Показать весь текущий гейм (50 очков)
      </Button>
      <Button
        sx={{
          color: "#FFFFFF",
          backgroundColor: COLORS.takeHintButton,
          flexGrow: 1,
        }}
        onClick={() => {
          setChosenHint("AllSessions");
          chart.chartData.chartHintUsed(200);
          changeScore(-200);
        }}
      >
        Показать все свои предыдущие геймы (200 очков)
      </Button> */}
      <Button
        sx={{
          color: "#FFFFFF",
          backgroundColor: COLORS.takeHintButton,
          flexGrow: 1,
        }}
        onClick={onSelectCrashProbability}
      >
        Показать рискованность продолжения ({hintCost} очков)
      </Button>
      <Button sx={backButtonSx} onClick={onClose}>
        Назад
      </Button>
    </>
  );
}
