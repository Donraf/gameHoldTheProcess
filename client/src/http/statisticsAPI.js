import { $authHost } from "./index";

export const getStatistics = async (userId, parSetId) => {
  try {
    const { data } = await $authHost.get(`api/statistics/user_id/${userId}/par_set_id/${parSetId}`);
    return data.data;
  } catch (e) {
    return null;
  }
};

export const computeStatistics = async (userId, parSetId) => {
  try {
    const { data } = await $authHost.post(`api/statistics/`, {
      user_id: userId,
      par_set_id: parSetId,
    });
    return data.data;
  } catch (e) {
    throw e;
  }
};
