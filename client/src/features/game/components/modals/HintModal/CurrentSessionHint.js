import React from "react";
import { Button, Typography } from "@mui/material";
import { Chart } from "react-chartjs-2";
import { chartOptions } from "../../../constants";

const noSelectSx = { userSelect: "none" };
const backButtonSx = {
  color: "#FFFFFF",
  backgroundColor: "#9356A0",
  flexGrow: 1,
};

export default function CurrentSessionHint({ chartData, chartRef, onBack }) {
  return (
    <>
      <Typography sx={noSelectSx}>Вся текущая сессия</Typography>
      <Chart
        ref={chartRef}
        options={chartOptions}
        data={chartData.formData(
          chartData.points.slice(chartData.maxPointsToShow, -chartData.checkDangerNum)
        )}
      />
      <Button sx={backButtonSx} onClick={onBack}>
        Назад
      </Button>
    </>
  );
}
