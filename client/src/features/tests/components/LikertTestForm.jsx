import React, { useMemo, useState } from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";

import { parseTestConfig } from "../testTypes";

function resolveScale(question, config) {
  return {
    min: question.min ?? config.scale?.min ?? 1,
    max: question.max ?? config.scale?.max ?? 5,
    labels: question.labels ?? config.scale?.labels,
    min_label: question.min_label ?? config.scale?.min_label,
    max_label: question.max_label ?? config.scale?.max_label,
  };
}

function getOptionLabel(value, scale) {
  const { labels, min, max, min_label, max_label } = scale;

  if (labels) {
    const text = Array.isArray(labels)
      ? labels[value - min]
      : labels[value] ?? labels[String(value)];
    if (text) {
      return `${value} — ${text}`;
    }
  }

  if (value === min && min_label) {
    return `${value} — ${min_label}`;
  }
  if (value === max && max_label) {
    return `${value} — ${max_label}`;
  }

  return String(value);
}

export default function LikertTestForm({ test, onSubmit, submitting }) {
  const config = useMemo(() => parseTestConfig(test.config), [test.config]);
  const [answers, setAnswers] = useState({});

  const handleChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: Number(value) }));
  };

  const isComplete = config.questions.every((question) => answers[question.id] != null);

  return (
    <Stack spacing={3}>
      {config.questions.map((question) => {
        const scale = resolveScale(question, config);

        return (
          <Box key={question.id}>
            <Typography sx={{ mb: 1 }}>{question.text}</Typography>
            <TextField
              select
              fullWidth
              value={answers[question.id] ?? ""}
              onChange={(event) => handleChange(question.id, event.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="" disabled />
              {Array.from({ length: scale.max - scale.min + 1 }, (_, index) => {
                const value = scale.min + index;
                return (
                  <option key={value} value={value}>
                    {getOptionLabel(value, scale)}
                  </option>
                );
              })}
            </TextField>
          </Box>
        );
      })}
      <Button variant="contained" disabled={!isComplete || submitting} onClick={() => onSubmit(answers)}>
        Сохранить ответы
      </Button>
    </Stack>
  );
}
