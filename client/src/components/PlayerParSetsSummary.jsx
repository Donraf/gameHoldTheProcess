import React, { useEffect, useState } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { getStatistics } from "../http/statisticsAPI";
import { parSetLabel } from "../utils/parSet";

/**
 * Сводка по всем наборам параметров игрока, по которым есть статистика.
 * Клик по строке выбирает этот набор (selectedId подсвечивается).
 */
const PlayerParSetsSummary = ({ userId, parSets, selectedId, onSelect }) => {
  const [rows, setRows] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!parSets || parSets.length === 0) {
      setRows([]);
      return;
    }
    setRows(null);
    setFailed(false);
    Promise.all(
      parSets.map((parSet) =>
        getStatistics(userId, parSet.id).then(
          (stats) => ({ parSet, stats }),
          () => ({ parSet, stats: null })
        )
      )
    ).then(
      (result) => setRows(result),
      () => setFailed(true)
    );
  }, [userId, parSets]);

  if (failed) {
    return (
      <Typography sx={{ color: "text.secondary" }} component="div">
        Не удалось загрузить сводку по наборам параметров
      </Typography>
    );
  }

  if (rows === null) {
    return (
      <Typography sx={{ color: "text.secondary" }} component="div">
        Загрузка сводки по наборам…
      </Typography>
    );
  }

  if (rows.length === 0) {
    return null;
  }

  return (
    <TableContainer component={Paper} sx={{ maxWidth: 900 }}>
      <Table size="small" aria-label="parsets summary table">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: "bold" }}>Набор параметров</TableCell>
            <TableCell align="right" sx={{ fontWeight: "bold" }}>Игры</TableCell>
            <TableCell align="right" sx={{ fontWeight: "bold" }}>Остановки</TableCell>
            <TableCell align="right" sx={{ fontWeight: "bold" }}>Взрывы</TableCell>
            <TableCell align="right" sx={{ fontWeight: "bold" }}>Счёт</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(({ parSet, stats }) => (
            <TableRow
              key={parSet.id}
              hover
              selected={parSet.id === selectedId}
              onClick={() => onSelect(parSet.id)}
              sx={{ cursor: "pointer" }}
            >
              <TableCell>{parSetLabel(parSet)}</TableCell>
              {stats !== null ? (
                <>
                  <TableCell align="right">{stats.games_num}</TableCell>
                  <TableCell align="right">{stats.stops_num}</TableCell>
                  <TableCell align="right">{stats.crashes_num}</TableCell>
                  <TableCell align="right">{stats.total_score}</TableCell>
                </>
              ) : (
                <TableCell align="center" colSpan={4} sx={{ color: "text.secondary" }}>
                  не удалось загрузить
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PlayerParSetsSummary;
