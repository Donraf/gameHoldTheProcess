import { useCallback, useEffect, useState } from "react";
import { getParSet, getUserParSet, startSession as apiStartSession, updateUserUserParSet } from "../../../http/userAPI";
import { getServerRemTimeMs } from "../services/remTime";

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
          if (ups.score !== oldScore && !ups.is_training) {
            setTotalScore(0);
            changeTotalScore(ups.score);
          }
          setUserParSet(ups);
        }
      });
    });
  }, [updateParSet]); // eslint-disable-line react-hooks/exhaustive-deps -- refresh on explicit trigger only

  useEffect(() => {
    if (userParSet == null) {
      setIsTimeUp(false);
      return undefined;
    }

    const remMsAtFetch = getServerRemTimeMs(userParSet);
    const fetchedAt = Date.now();

    const check = () => {
      setIsTimeUp(remMsAtFetch - (Date.now() - fetchedAt) <= 0);
    };

    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
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

  const startSession = useCallback(() => {
    return apiStartSession(chartData.parSet.id).then((ups) => {
      setUserParSet(ups);
      return ups;
    });
  }, [chartData]);

  return {
    userParSet,
    isTimeUp,
    setIsTimeUp,
    shouldEndTime,
    setShouldEndTime,
    updateUserParSetUi,
    startSession,
  };
}
