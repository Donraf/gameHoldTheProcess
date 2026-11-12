import React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import DangerIcon from "../../../components/icons/DangerIcon";
import PlayButtonIcon from "../../../components/icons/PlayButtonIcon";
import StopButtonIcon from "../../../components/icons/StopButtonIcon";
import TakeHintButtonIcon from "../../../components/icons/TakeHintButtonIcon";
import { COLORS } from "../../../utils/constants";

const noSelectSx = { userSelect: "none" };

export default function DangerOverlay({ isDanger, onContinue, onOpenHints, onStop }) {
  if (!isDanger) {
    return null;
  }

  return (
    <Box
      className="alert-border"
      sx={{
        position: "fixed",
        zIndex: 5500,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        display: "flex",
        padding: "0.75rem",
        borderRadius: "12px",
        backgroundColor: "#FFFFFF",
        border: "black solid 4px",
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} alignItems={"center"}>
          <DangerIcon />
          <Typography variant="h5" sx={noSelectSx}>
            Опасность взрыва! Решите, что делать.
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button
            sx={{
              color: "#FFFFFF",
              backgroundColor: COLORS.continueButton,
              flexGrow: 1,
            }}
            onClick={onContinue}
            startIcon={<PlayButtonIcon />}
          >
            Продолжить процесс
          </Button>
          <Button
            sx={{
              color: "#FFFFFF",
              backgroundColor: COLORS.takeHintButton,
              flexGrow: 1,
            }}
            onClick={onOpenHints}
            startIcon={<TakeHintButtonIcon />}
          >
            Купить подсказки
          </Button>
          <Button
            sx={{
              color: "#FFFFFF",
              backgroundColor: COLORS.stopButton,
              flexGrow: 1,
            }}
            onClick={onStop}
            startIcon={<StopButtonIcon />}
          >
            Завершить процесс
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
