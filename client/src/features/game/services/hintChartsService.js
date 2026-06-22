import { fetchPointsByChartId } from "../../../http/pointAPI";

export async function chartToHintCharts(charts) {
  const hintCharts = [];
  for (const i in charts) {
    const points = await fetchPointsByChartId(charts[i].id);
    hintCharts.push({
      id: charts[i].id,
      createdAt: charts[i].created_at,
      points,
    });
  }
  return hintCharts;
}
