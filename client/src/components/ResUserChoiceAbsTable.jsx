import React from "react";
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";

/**
 * Сводная таблица абсолютного числа реакций по значениям процесса.
 * Берёт агрегированный чанк «Все точки принятия решений» из статистики
 * Венгера (взаимоисключающие реакции) и транспонирует его:
 * столбцы — значения процесса, строки — виды реакций.
 */
export default function ResUserChoiceAbsTable({ choiceStats }) {
  let xs;
  let rows;
  try {
    if (!choiceStats || choiceStats === "{}") return null;
    const chunks = JSON.parse(choiceStats);
    if (!Array.isArray(chunks) || chunks.length === 0) return null;

    // Агрегированный чанк сервер кладёт последним.
    const aggregated = chunks[chunks.length - 1];
    const stat = aggregated.ChunkChoiceStat;
    xs = Object.keys(stat).sort((a, b) => Number(a) - Number(b));

    const pick = (field) => xs.map((x) => (stat[x][field] > 0 ? stat[x][field] : "—"));
    rows = [
      { label: "Ост", title: "Количество остановок", data: pick("StopAbs") },
      { label: "Прд", title: "Количество продолжений процесса", data: pick("ContAbs") },
      { label: "Зпр", title: "Количество запросов информации", data: pick("HintAbs") },
    ];
  } catch {
    return null;
  }

  return (
    <TableContainer component={Paper} sx={{ maxWidth: "100%", overflowX: "auto" }}>
      <Table size="small" aria-label="reaction counts table" sx={{ "& td, & th": { textAlign: "center", minWidth: 48 } }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: "bold" }}>Реакция</TableCell>
            {xs.map((x) => (
              <TableCell key={x} sx={{ fontWeight: "bold" }}>
                {x}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.label}>
              <TableCell component="th" scope="row" title={row.title} sx={{ fontWeight: "bold" }}>
                {row.label}
              </TableCell>
              {row.data.map((value, ind) => (
                <TableCell key={xs[ind]}>{value}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
