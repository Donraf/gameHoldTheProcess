import React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import DecreaseSpeedIcon from "../../../components/icons/DecreaseSpeedIcon";
import IncreaseSpeedIcon from "../../../components/icons/IncreaseSpeedIcon";
import PauseButtonIcon from "../../../components/icons/PauseButtonIcon";
import PlayButtonIcon from "../../../components/icons/PlayButtonIcon";
import { COLORS } from "../../../utils/constants";

const noSelectSx = { userSelect: "none" };
const speedButtonSx = {
  color: "#FFFFFF",
  backgroundColor: "#9356A0",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  px: "8px",
  py: "12px",
  borderRadius: "4px",
};

function ActiveControls({
  isChartPaused,
  isDanger,
  curSpeed,
  onDecreaseSpeed,
  onIncreaseSpeed,
  onContinue,
  onPause,
}) {
  return (
    <Stack display="flex" direction="column" spacing={1}>
      <Stack display="flex" direction="row" spacing={1}>
        <Box sx={speedButtonSx} onClick={onDecreaseSpeed}>
          <DecreaseSpeedIcon />
        </Box>
        <Box
          sx={{
            width: "60px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #000000",
            borderRadius: "4px",
          }}
        >
          <Typography variant="h6" sx={noSelectSx}>
            {"x" + curSpeed.toString()}
          </Typography>
        </Box>
        <Box sx={speedButtonSx} onClick={onIncreaseSpeed}>
          <IncreaseSpeedIcon />
        </Box>
        {isChartPaused ? (
          <Button
            sx={{
              color: "#FFFFFF",
              backgroundColor: COLORS.continueButton,
              flexGrow: 1,
            }}
            disabled={isDanger}
            onClick={onContinue}
            startIcon={<PlayButtonIcon />}
          >
            Продолжить
          </Button>
        ) : (
          <Button
            sx={{
              color: "#FFFFFF",
              backgroundColor: COLORS.takeHintButton,
              flexGrow: 1,
            }}
            onClick={onPause}
            startIcon={<PauseButtonIcon />}
          >
            Пауза
          </Button>
        )}
        {/* <Button
          sx={{
            color: "#FFFFFF",
            backgroundColor: COLORS.stopButton,
            flexGrow: 1,
          }}
          disabled={isDanger}
          onClick={() => {
            setIsChartStopped(true);
            setIsDanger(false);
          }}
          startIcon={<StopButtonIcon />}
        >
          Завершить процесс
        </Button> */}
      </Stack>
      {/* {isChartPaused ? (
        <Button
          sx={{
            color: "#FFFFFF",
            backgroundColor: COLORS.takeHintButton,
            flexGrow: 1,
          }}
          onClick={() => {
            handleOpenHintModal();
          }}
          startIcon={<TakeHintButtonIcon />}
        >
          Купить подсказки
        </Button>
      ) : (
        <></>
      )} */}
    </Stack>
  );
}

export default function GameControls({
  isAuth,
  userParSet,
  isChartPaused,
  isTimeUp,
  isDanger,
  curSpeed,
  onStartGame,
  onDecreaseSpeed,
  onIncreaseSpeed,
  onContinue,
  onPause,
}) {
  if (!isAuth) {
    return (
      <Typography sx={{ textAlign: "center" }} variant="h2">
        Войдите в аккаунт, чтобы начать игру
      </Typography>
    );
  }

  const showStartButton =
    (userParSet == null ||
      (userParSet.is_training && userParSet.training_start_time == null) ||
      (!userParSet.is_training && userParSet.game_start_time == null)) &&
    isChartPaused;

  if (showStartButton) {
    return (
      <Button
        sx={{
          color: "#FFFFFF",
          backgroundColor: "#9356A0",
          width: "100%",
        }}
        onClick={onStartGame}
      >
        Начать игру!
      </Button>
    );
  }

  if (isTimeUp) {
    if (userParSet.is_training) {
      return (
        <Typography sx={{ textAlign: "center" }} variant="h2">
          Время для тренировки истекло. Перейдите в основной режим.
        </Typography>
      );
    }
    return (
      <Typography sx={{ textAlign: "center" }} variant="h2">
        Время основной игры истекло. Спасибо за игру!
      </Typography>
    );
  }

  return (
    <ActiveControls
      isChartPaused={isChartPaused}
      isDanger={isDanger}
      curSpeed={curSpeed}
      onDecreaseSpeed={onDecreaseSpeed}
      onIncreaseSpeed={onIncreaseSpeed}
      onContinue={onContinue}
      onPause={onPause}
    />
  );
}
