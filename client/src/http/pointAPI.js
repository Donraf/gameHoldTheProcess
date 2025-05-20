import {$authHost} from "./index";

export const fetchPointsInCsv = async () => {
    try {
        const {data} = await $authHost.get('api/point/csv');
        return data
    } catch (e) {
        throw e;
    }
}

export const fetchPointsByChartId = async (chartId) => {
    try {
        const {data} = await $authHost.get('api/point/chart_id/'+chartId);
        return data
    } catch (e) {
        throw e;
    }
}