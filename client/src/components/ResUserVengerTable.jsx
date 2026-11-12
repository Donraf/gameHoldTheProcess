import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import React from "react";

function formTableData(choiceStats) {
  if (!choiceStats || choiceStats === "{}") return [];
  var tableData = JSON.parse(choiceStats);
  return tableData;
}

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
