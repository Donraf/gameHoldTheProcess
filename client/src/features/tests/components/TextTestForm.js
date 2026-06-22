import React, { useMemo, useState } from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";

import { parseTestConfig } from "../testTypes";

export default function TextTestForm({ test, onSubmit, submitting }) {
  const config = useMemo(() => parseTestConfig(test.config), [test.config]);
  const [answers, setAnswers] = useState({});

  const handleChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const isComplete = config.questions.every((question) => (answers[question.id] || "").trim() !== "");

  return (
    <Stack spacing={3}>
      {config.questions.map((question) => (
        <Box key={question.id}>
          <Typography sx={{ mb: 1 }}>{question.text}</Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            value={answers[question.id] || ""}
            onChange={(event) => handleChange(question.id, event.target.value)}
          />
        </Box>
      ))}
      <Button variant="contained" disabled={!isComplete || submitting} onClick={() => onSubmit(answers)}>
        Сохранить ответы
      </Button>
    </Stack>
  );
}
