import {$authHost, $host} from "./index";

export const createGraph = async (graph) => {
    try {
        const {data} = await $authHost.post('api/chart', graph);
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