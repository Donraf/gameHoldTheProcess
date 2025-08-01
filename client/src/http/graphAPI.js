import {$authHost, $host} from "./index";

export const createGraph = async (points, user_id, par_set_id) => {
    try {
        const {data} = await $authHost.post('api/chart', {user_id: user_id, par_set_id: par_set_id});
        await $authHost.post('api/user/score', {userId: user_id, parSetId: par_set_id, score: points[points.length - 1].score});
        let graphId = data.id
        for (const point of points) {
            await $authHost.post('api/point',
                {
                    chart_id: graphId,
                    x: point.x,
                    y: point.y,
                    score: point.score,
                    is_end: point.is_end,
                    is_crash: point.is_crash,
                    is_useful_ai_signal: point.is_useful_ai_signal,
                    is_deceptive_ai_signal: point.is_deceptive_ai_signal,
                    is_stop: point.is_stop,
                    is_pause: point.is_pause,
                    is_check: point.is_check
                }
            );
        }
        return data;
    } catch (e) {
        throw e;
    }
}

export const getGraphsPageCount = async (filterTag = null, filterValue = null) => {
    try {
        const pageCount = await $host.post('api/chart/pageCount',
            {
                filter_tag: filterTag,
                filter_value: filterValue,
            }
        );
        return pageCount.data.pageCount;
    } catch (e) {
        throw e;
    }
}

export const getGraphsCount = async (filterTag = null, filterValue = null) => {
    try {
        const graphCount = await $host.post('api/chart/count',
            {
                filter_tag: filterTag,
                filter_value: filterValue,
            }
        );
        return graphCount.data.count;
    } catch (e) {
        throw e;
    }
}

export const fetchGraphs = async (filterTag = null, filterValue = null, currentPage = null) => {
    try {
        const {data} = await $host.post('api/chart/charts',
            {
                filter_tag: filterTag,
                filter_value: filterValue,
                current_page: currentPage,
            }
        );
        return data;
    } catch (e) {
        throw e;
    }
}

export const deleteGraph = async (id) => {
    try {
        await $authHost.delete(`api/chart/${id}`);
    } catch (e) {
        if (e.response.status === 527) {
            throw new Error(e.response.data.message);
        }
        throw e;
    }
}