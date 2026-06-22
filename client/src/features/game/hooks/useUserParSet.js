import { useCallback, useEffect, useState } from "react";
import { gameTimeLimitMs, trainingTimeLimitMs } from "../constants";
import { getParSet, getUserParSet, updateUserUserParSet } from "../../../http/userAPI";
import { getRemTimeRaw } from "../../../utils/getTimeDiff";

export function useUserParSet({ isAuth, userId, chartData, setTotalScore, changeTotalScore }) {
  const [userParSet, setUserParSet] = useState(null);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [shouldEndTime, setShouldEndTime] = useState(false);
  const [updateParSet, setUpdateParSet] = useState(true);

  const refreshParSet = useCallback(() => {
    setUpdateParSet((prevState) => !prevState);
  }, []);

  useEffect(() => {
    if (!isAuth) {
      return;
    }

    const oldUps = userParSet;
    const oldScore = chartData.score;

    async function fetchParSet() {
      const parSet = await getParSet(userId);
      chartData.setParSet(parSet);
      return parSet;
    }

    fetchParSet().then((parSet) => {
      getUserParSet(userId, parSet.id).then((ups) => {
        if (
          oldUps == null ||
          oldUps.is_training !== ups.is_training ||
          oldUps.training_start_time !== ups.training_start_time ||
          oldUps.game_start_time !== ups.game_start_time
        ) {
          if (ups.score !== oldScore && ups !== null && !ups.is_training) {
            setTotalScore(0);
            changeTotalScore(ups.score);
          }
          setUserParSet(ups);
        }
      });
    });
  }, [updateParSet]);

  useEffect(() => {
    setIsTimeUp(
      userParSet != null &&
        ((userParSet.is_training && getRemTimeRaw(userParSet.training_start_time, trainingTimeLimitMs) <= 0) ||
          (!userParSet.is_training && getRemTimeRaw(userParSet.game_start_time, gameTimeLimitMs) <= 0))
    );
  }, [userParSet]);

  const updateUserParSetUi = useCallback(
    (updateInfo) => {
      updateInfo.par_set_id = chartData.parSet.id;
      updateUserUserParSet(userId, updateInfo).then(() => {
        refreshParSet();
      });
    },
    [chartData, userId, refreshParSet]
  );

  return {
    userParSet,
    isTimeUp,
    setIsTimeUp,
    shouldEndTime,
    setShouldEndTime,
    updateUserParSetUi,
  };
}
