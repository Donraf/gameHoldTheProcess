import {
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import React, { useRef } from "react";
import Grid from "@mui/material/Grid2";

function formChartData(choiceStats) {
  try {
    if (!choiceStats || choiceStats === "{}") return null;
    var chunksData = [];
    var jsCS = JSON.parse(choiceStats);
    const labels = Object.keys(jsCS[0].ChunkChoiceStat);
    for (const i in jsCS) {
      const chunk = jsCS[i];
      const hintDS = { label: "Подсказка", type: "line", borderColor: "rgb(255,0,0)", spanGaps: true, data: [] };
      const contDS = { label: "Продолжение", type: "line", borderColor: "rgb(0,0,255)", spanGaps: true, data: [] };
      const stopDS = { label: "Остановка", type: "line", borderColor: "rgb(0,255,0)", spanGaps: true, data: [] };
      for (const j in chunk.ChunkChoiceStat) {
        if (
          chunk.ChunkChoiceStat[j].HintRel + chunk.ChunkChoiceStat[j].ContRel + chunk.ChunkChoiceStat[j].StopRel ===
          0
        ) {
          hintDS.data.push(NaN);
          contDS.data.push(NaN);
          stopDS.data.push(NaN);
        } else {
          hintDS.data.push(chunk.ChunkChoiceStat[j].HintRel);
          contDS.data.push(chunk.ChunkChoiceStat[j].ContRel);
          stopDS.data.push(chunk.ChunkChoiceStat[j].StopRel);
        }
      }
      chunksData.push({
        chartTitle: chunk.Title,
        labels: labels,
        datasets: [hintDS, contDS, stopDS],
      });
    }
    return chunksData;
  } catch {
    return null;
  }
}

function formTableData(choiceStats) {
  if (!choiceStats || choiceStats === "{}") return [];
  var tableData = JSON.parse(choiceStats);
  return tableData;
}

// function formTableData(choiceStats) {
//   if (!choiceStats || choiceStats === "{}") return [];
//   var tableData = [];
//   var jsCS = JSON.parse(choiceStats);
//   for (const i in jsCS) {
//     const chunk = jsCS[i];
//     const chunkData = [];
//     for (var j in chunk.ChunkChoiceStat) {
//       chunkData.push([j, chunk.ChunkChoiceStat[j]]);
//     }
//     tableData.push(chunkData);
//   }
//   return tableData;
// }

export default function ResUserVengerTable({ choiceStats }) {
  const tableData = formTableData(choiceStats);
  return (
    <>
      {tableData ? (
        <TableContainer component={Paper}>
          <Table aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell width="10%">Y</TableCell>
                <TableCell width="10%">1-й выбор</TableCell>
                <TableCell width="10%"></TableCell>
                <TableCell width="10%"></TableCell>
                <TableCell width="10%">2-й выбор</TableCell>
                <TableCell width="10%"></TableCell>
                <TableCell width="10%"></TableCell>
                <TableCell width="10%"></TableCell>
                <TableCell width="10%"></TableCell>
                <TableCell width="10%"></TableCell>
              </TableRow>
              <TableRow>
                <TableCell width="10%"></TableCell>
                <TableCell width="10%">Прд</TableCell>
                <TableCell width="10%">Ост</TableCell>
                <TableCell width="10%">Подск</TableCell>
                <TableCell width="10%">Выс</TableCell>
                <TableCell width="10%"></TableCell>
                <TableCell width="10%">Ср</TableCell>
                <TableCell width="10%"></TableCell>
                <TableCell width="10%">Низ</TableCell>
                <TableCell width="10%"></TableCell>
              </TableRow>
              <TableRow>
                <TableCell width="10%"></TableCell>
                <TableCell width="10%"></TableCell>
                <TableCell width="10%"></TableCell>
                <TableCell width="10%"></TableCell>
                <TableCell width="10%">Прд</TableCell>
                <TableCell width="10%">Ост</TableCell>
                <TableCell width="10%">Прд</TableCell>
                <TableCell width="10%">Ост</TableCell>
                <TableCell width="10%">Прд</TableCell>
                <TableCell width="10%">Ост</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tableData.map((point) => {
                return (
                  <TableRow>
                    <TableCell>{point.Y}</TableCell>
                    <TableCell>{point.ChoiceType === "cont" ? 1 : "-"}</TableCell>
                    <TableCell>{point.ChoiceType === "stop" ? 1 : "-"}</TableCell>
                    <TableCell>
                      {point.ChoiceType === "stopL" ||
                      point.ChoiceType === "stopM" ||
                      point.ChoiceType === "stopH" ||
                      point.ChoiceType === "contL" ||
                      point.ChoiceType === "contM" ||
                      point.ChoiceType === "contH"
                        ? 1
                        : "-"}
                    </TableCell>
                    <TableCell>{point.ChoiceType === "contH" ? 1 : "-"}</TableCell>
                    <TableCell>{point.ChoiceType === "stopH" ? 1 : "-"}</TableCell>
                    <TableCell>{point.ChoiceType === "contM" ? 1 : "-"}</TableCell>
                    <TableCell>{point.ChoiceType === "stopM" ? 1 : "-"}</TableCell>
                    <TableCell>{point.ChoiceType === "contL" ? 1 : "-"}</TableCell>
                    <TableCell>{point.ChoiceType === "stopL" ? 1 : "-"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <></>
      )}
    </>
  );
}
