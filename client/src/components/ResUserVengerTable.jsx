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
  try {
    return JSON.parse(choiceStats);
  } catch {
    return [];
  }
}

const headCell = { fontWeight: "bold", textAlign: "center", border: "1px solid rgba(224, 224, 224, 1)" };
const bodyCell = { textAlign: "center" };

const Mark = ({ active }) => (active ? "1" : "—");

/**
 * Таблица Венгера: по каждому значению процесса — первый выбор игрока
 * (продолжение/остановка/подсказка) и второй выбор после подсказки
 * по уровням риска (высокий/средний/низкий).
 */
export default function ResUserVengerTable({ choiceStats }) {
  const tableData = formTableData(choiceStats);
  if (!tableData || tableData.length === 0) {
    return null;
  }

  return (
    <TableContainer component={Paper} sx={{ maxWidth: 900 }}>
      <Table size="small" aria-label="venger table">
        <TableHead>
          <TableRow>
            <TableCell rowSpan={3} sx={headCell}>
              Y
            </TableCell>
            <TableCell colSpan={3} sx={headCell}>
              1-й выбор
            </TableCell>
            <TableCell colSpan={6} sx={headCell}>
              2-й выбор после подсказки
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell rowSpan={2} sx={headCell}>
              Прд
            </TableCell>
            <TableCell rowSpan={2} sx={headCell}>
              Ост
            </TableCell>
            <TableCell rowSpan={2} sx={headCell}>
              Подск
            </TableCell>
            <TableCell colSpan={2} sx={headCell}>
              Выс
            </TableCell>
            <TableCell colSpan={2} sx={headCell}>
              Ср
            </TableCell>
            <TableCell colSpan={2} sx={headCell}>
              Низ
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={headCell}>Прд</TableCell>
            <TableCell sx={headCell}>Ост</TableCell>
            <TableCell sx={headCell}>Прд</TableCell>
            <TableCell sx={headCell}>Ост</TableCell>
            <TableCell sx={headCell}>Прд</TableCell>
            <TableCell sx={headCell}>Ост</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tableData.map((point, ind) => (
            <TableRow key={`${point.Y}-${ind}`}>
              <TableCell sx={bodyCell}>{point.Y}</TableCell>
              <TableCell sx={bodyCell}>
                <Mark active={point.ChoiceType === "cont"} />
              </TableCell>
              <TableCell sx={bodyCell}>
                <Mark active={point.ChoiceType === "stop"} />
              </TableCell>
              <TableCell sx={bodyCell}>
                <Mark
                  active={["stopL", "stopM", "stopH", "contL", "contM", "contH"].includes(point.ChoiceType)}
                />
              </TableCell>
              <TableCell sx={bodyCell}>
                <Mark active={point.ChoiceType === "contH"} />
              </TableCell>
              <TableCell sx={bodyCell}>
                <Mark active={point.ChoiceType === "stopH"} />
              </TableCell>
              <TableCell sx={bodyCell}>
                <Mark active={point.ChoiceType === "contM"} />
              </TableCell>
              <TableCell sx={bodyCell}>
                <Mark active={point.ChoiceType === "stopM"} />
              </TableCell>
              <TableCell sx={bodyCell}>
                <Mark active={point.ChoiceType === "contL"} />
              </TableCell>
              <TableCell sx={bodyCell}>
                <Mark active={point.ChoiceType === "stopL"} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
