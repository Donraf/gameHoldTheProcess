import React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { Chart } from "react-chartjs-2";
import DecreaseSpeedIcon from "../../../../../components/icons/DecreaseSpeedIcon";
import IncreaseSpeedIcon from "../../../../../components/icons/IncreaseSpeedIcon";
import { ChartData } from "../../../../../utils/ChartData";
import { transformToUiDateDayTime } from "../../../../../utils/transformDate";
import { chartOptions } from "../../../constants";

const noSelectSx = { userSelect: "none" };
const backButtonSx = {
  color: "#FFFFFF",
  backgroundColor: "#9356A0",
  flexGrow: 1,
};
const navButtonSx = {
  color: "#FFFFFF",
  backgroundColor: "#9356A0",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  px: "8px",
  py: "12px",
  borderRadius: "4px",
};

export default function AllSessionsHint({
  chartRef,
  hintCharts,
  hintModalDataFetched,
  curLocalHintChartNum,
  endGameCause,
  curHintChartNum,
  countHintCharts,
  onPrev,
  onNext,
  onBack,
}) {
  const chartData = new ChartData();
  if (hintModalDataFetched && hintCharts.length > 0) {
    chartData.restoreFromPoints(hintCharts[curLocalHintChartNum].points);
  }

  return (
    <>
      {hintModalDataFetched && hintCharts.length > 0 ? (
        <>
          <Typography sx={noSelectSx}>Все предыдущие сессии</Typography>
          <Typography sx={noSelectSx}>
            Игровая сессия {transformToUiDateDayTime(hintCharts[curLocalHintChartNum].createdAt)}
          </Typography>
          <Typography sx={noSelectSx}>Причина завершения: {endGameCause}</Typography>
          <Chart ref={chartRef} options={chartOptions} data={chartData.data} />
        </>
      ) : (
        <>
          {hintCharts.length <= 0 ? (
            <Typography sx={noSelectSx}>Предыдущих сессий нет</Typography>
          ) : (
            <></>
          )}
        </>
      )}
      <Stack display="flex" direction="row" spacing={1}>
        <Box sx={navButtonSx} onClick={onPrev}>
          <DecreaseSpeedIcon />
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #000000",
            borderRadius: "4px",
          }}
        >
          <Typography variant="h6" sx={noSelectSx}>
            {curHintChartNum + "/" + countHintCharts}
          </Typography>
        </Box>
        <Box sx={navButtonSx} onClick={onNext}>
          <IncreaseSpeedIcon />
        </Box>
        <Button sx={backButtonSx} onClick={onBack}>
          Назад
        </Button>
      </Stack>
    </>
  );
}
