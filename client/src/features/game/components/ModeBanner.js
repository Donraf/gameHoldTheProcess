import React from "react";
import { Button, Stack, Typography } from "@mui/material";
import Timer from "../../../components/Timer";
import { gameTimeLimitMs, trainingTimeLimitMs } from "../constants";
import { millisToMinutesAndSeconds } from "../../../utils/getTimeDiff";
import { getServerRemTimeMs } from "../services/remTime";

export default function ModeBanner({ userParSet, onDeadline, onEndTraining }) {
  if (userParSet == null) {
    return null;
  }

  if (userParSet.is_training) {
    return (
      <Stack
        justifyContent="center"
        alignItems="center"
        display="flex"
        direction="row"
        gap={1}
        sx={{
          textAlign: "center",
          background: "orange",
          padding: "10px",
          marginBottom: "10px",
          borderRadius: "10px",
        }}
      >
        <Typography sx={{ textAlign: "center" }}> Тренировочный режим. Оставшееся время:</Typography>
        {userParSet.training_start_time != null ? (
          <Timer
            active={userParSet.training_start_time != null}
            deadlineIntervalMs={getServerRemTimeMs(userParSet)}
            onDeadline={onDeadline}
          />
        ) : (
          <>{millisToMinutesAndSeconds(trainingTimeLimitMs)}</>
        )}
        <Button
          sx={{
            color: "#FFFFFF",
            backgroundColor: "#9356A0",
          }}
          onClick={onEndTraining}
        >
          Закончить тренировку
        </Button>
      </Stack>
    );
  }

  return (
    <Stack
      justifyContent="center"
      alignItems="center"
      display="flex"
      direction="row"
      gap={1}
      sx={{
        textAlign: "center",
        background: "green",
        padding: "10px",
        marginBottom: "10px",
        borderRadius: "10px",
      }}
    >
      <Typography sx={{ textAlign: "center", color: "#ffffff" }}> Основной режим. Оставшееся время:</Typography>
      {userParSet.game_start_time != null ? (
        <Timer
          active={userParSet.game_start_time != null}
          deadlineIntervalMs={getServerRemTimeMs(userParSet)}
          onDeadline={onDeadline}
          textClr="#ffffff"
        />
      ) : (
        <Typography sx={{ color: "#ffffff" }}>{millisToMinutesAndSeconds(gameTimeLimitMs)}</Typography>
      )}
    </Stack>
  );
}
