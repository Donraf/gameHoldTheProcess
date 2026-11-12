import React from "react";
import { Button, Stack, Typography } from "@mui/material";
import { COLORS } from "../../../../utils/constants";
import GameModal from "./GameModal";

export default function TrainingEndModal({ open, onClose, onConfirmEndTraining }) {
  return (
    <GameModal open={open} onClose={onClose} zIndex={6500} contentSx={{ width: 800 }}>
      <Typography>
        Вы уверены, что хотите перейти в обычный режим? После этого действия вернуться к тренировке будет нельзя.
      </Typography>
      <Stack direction="row" gap={2}>
        <Button
          sx={{
            color: "#FFFFFF",
            backgroundColor: COLORS.graphGradientLow,
            width: "100%",
          }}
          onClick={onClose}
        >
          Продолжить тренироваться
        </Button>
        <Button
          sx={{
            color: "#FFFFFF",
            backgroundColor: "orange",
            width: "100%",
          }}
          onClick={onConfirmEndTraining}
        >
          Закончить тренировку
        </Button>
      </Stack>
    </GameModal>
  );
}
