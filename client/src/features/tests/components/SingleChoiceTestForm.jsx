import React, { useMemo, useState } from "react";
import { Box, Button, FormControlLabel, Radio, RadioGroup, Stack, Typography } from "@mui/material";

import { parseTestConfig } from "../testTypes";

export default function SingleChoiceTestForm({ test, onSubmit, submitting }) {
  const config = useMemo(() => parseTestConfig(test.config), [test.config]);
  const [answers, setAnswers] = useState({});

  const handleChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const isComplete = config.questions.every((question) => answers[question.id]);

  return (
    <Stack spacing={3}>
      {config.questions.map((question) => (
        <Box key={question.id}>
          <Typography sx={{ mb: 1 }}>{question.text}</Typography>
          <RadioGroup
            value={answers[question.id] || ""}
            onChange={(event) => handleChange(question.id, event.target.value)}
          >
            {question.options.map((option) => (
              <FormControlLabel key={option} value={option} control={<Radio />} label={option} />
            ))}
          </RadioGroup>
        </Box>
      ))}
      <Button variant="contained" disabled={!isComplete || submitting} onClick={() => onSubmit(answers)}>
        Сохранить ответы
      </Button>
    </Stack>
  );
}
