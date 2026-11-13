import { $authHost } from "./index";

export const fetchPointsByChartId = async (chartId) => {
  try {
    const { data } = await $authHost.get("api/point/chart_id/" + chartId);
    return data.data;
  } catch (e) {
    throw e;
  }
};
