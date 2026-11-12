import React, { useEffect, useState } from "react";
import {
  Button,
  CircularProgress,
  Collapse,
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
import { fetchPlayerTestResults } from "../http/testAPI";
import { buildAnswerRows } from "../features/tests/formatTestAnswers";
import { COLORS } from "../utils/constants";

function formatCompletedAt(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ru-RU");
}

function TestResultCard({ result, answerRows }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography sx={{ color: "#232E4A", fontSize: 16, fontWeight: "bold" }}>
            {result.title}
          </Typography>
          <Typography sx={{ color: "#232E4A", fontSize: 14 }}>
            Пройден: {formatCompletedAt(result.completed_at)}
            {result.score != null ? ` | Средний балл: ${result.score.toFixed(2)}` : ""}
          </Typography>
        </Stack>
        {result.description ? (
          <Typography sx={{ color: "#232E4A", fontSize: 14 }}>{result.description}</Typography>
        ) : null}
        <Button
          variant="outlined"
          onClick={() => setExpanded((prev) => !prev)}
          sx={{
            alignSelf: "flex-start",
            color: "#FFFFFF",
            backgroundColor: COLORS.mainTheme,
          }}
        >
          {expanded ? "Скрыть ответы" : "Показать ответы"}
        </Button>
        <Collapse in={expanded}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width={48}>№</TableCell>
                  <TableCell>Вопрос</TableCell>
                  <TableCell width="35%">Ответ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {answerRows.map((row) => (
                  <TableRow key={`${result.id}-${row.number}`}>
                    <TableCell>{row.number}</TableCell>
                    <TableCell>{row.question}</TableCell>
                    <TableCell>{row.answer}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Collapse>
      </Stack>
    </Paper>
  );
}

export default function PlayerTestResults({ userId }) {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    fetchPlayerTestResults(userId)
      .then((data) => {
        if (!cancelled) {
          setResults(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResults([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return (
      <Stack alignItems="center" py={2}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (results.length === 0) {
    return (
      <Typography sx={{ color: "#232E4A", fontSize: 16 }} component="div">
        Пройденных тестов нет.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {results.map((result) => {
        const answerRows = buildAnswerRows(result.slug, result.config, result.answers);

        return <TestResultCard key={result.id} result={result} answerRows={answerRows} />;
      })}
    </Stack>
  );
}
