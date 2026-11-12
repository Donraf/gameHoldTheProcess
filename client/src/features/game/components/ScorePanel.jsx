import React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";

const noSelectSx = { userSelect: "none" };
const scoreRowSx = {
  height: 50,
  overflow: "hidden",
  display: "flex",
  direction: "row",
  gap: "5px",
};

function ScoreDelta({ scoreChange, updateFlag }) {
  return (
    <Typography
      key={updateFlag}
      className="move-up"
      variant="h3"
      color={scoreChange < 0 ? "red" : "green"}
      sx={noSelectSx}
    >
      {" "}
      {scoreChange > 0 ? "+" + scoreChange : ""}
      {scoreChange < 0 ? scoreChange : ""}
    </Typography>
  );
}

export default function ScorePanel({
  totalScore,
  totalScoreChange,
  gameScore,
  scoresChanges,
  onOpenRules,
}) {
  return (
    <Stack justifyContent="space-between" alignContent="flex-start" display="flex" direction="row">
      <Stack display="flex" direction="column">
        <Box sx={scoreRowSx}>
          <Typography variant="h3" sx={noSelectSx}>
            Очки за сет: {totalScore}
          </Typography>
          <ScoreDelta scoreChange={totalScoreChange.scoreChange} updateFlag={totalScoreChange.updateFlag} />
        </Box>
        <Box sx={scoreRowSx}>
          <Typography variant="h3" sx={noSelectSx}>
            Очки за гейм: {gameScore}
          </Typography>
          <ScoreDelta scoreChange={scoresChanges.scoreChange} updateFlag={scoresChanges.updateFlag} />
        </Box>
      </Stack>
      <Button
        sx={{
          color: "#9356A0",
          border: "#9356A0 1px solid",
          height: 40,
        }}
        onClick={onOpenRules}
      >
        Правила игры
      </Button>
    </Stack>
  );
}
