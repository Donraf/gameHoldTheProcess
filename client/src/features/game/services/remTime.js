import { gameTimeLimitMs, trainingTimeLimitMs } from "../constants";
import { getRemTimeRaw } from "../../../utils/getTimeDiff";

export const getServerRemTimeMs = (userParSet) => {
  if (userParSet == null) {
    return 0;
  }
  if (userParSet.rem_time_ms != null) {
    return userParSet.rem_time_ms;
  }
  const start = userParSet.is_training ? userParSet.training_start_time : userParSet.game_start_time;
  const limit = userParSet.is_training ? trainingTimeLimitMs : gameTimeLimitMs;
  return getRemTimeRaw(start, limit);
};
