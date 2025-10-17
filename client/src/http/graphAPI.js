import { $authHost } from "./index";

export const createGraph = async (points, user_id, par_set_id, totalScore, isTraining) => {
  try {
    const { data } = await $authHost.post("api/chart/", {
      user_id: user_id,
      par_set_id: par_set_id,
      is_training: isTraining,
    });
    if (!isTraining) {
      await $authHost.post("api/user/score", {
        userId: user_id,
        parSetId: par_set_id,
        score: totalScore,
      });
    }
    let graphId = data.id;
    for (const point of points) {
      await $authHost.post("api/point/", {
        chart_id: graphId,
        x: parseFloat(point.x),
        y: parseFloat(point.y),
        score: point.score,
        is_crash: point.is_crash,
        is_useful_ai_signal: point.is_useful_ai_signal,
        is_deceptive_ai_signal: point.is_deceptive_ai_signal,
        is_stop: point.is_stop,
        is_pause: point.is_pause,
        is_check: point.is_check,
      });
    }
    return data;
  } catch (e) {
    throw e;
  }
};

export const getGraphsPageCount = async (filterTag = null, filterValue = null) => {
  try {
    const pageCount = await $authHost.post("api/chart/pageCount", {
      filter_tag: filterTag,
      filter_value: String(filterValue),
    });
    return pageCount.data.pageCount;
  } catch (e) {
    throw e;
  }
};

export const getGraphsCount = async (filterTag = null, filterValue = null) => {
  try {
    const graphCount = await $authHost.post("api/chart/count", {
      filter_tag: filterTag,
      filter_value: String(filterValue),
    });
    return graphCount.data.count;
  } catch (e) {
    throw e;
  }
};

export const fetchGraphs = async (filterTag = null, filterValue = null, currentPage = null) => {
  try {
    if (currentPage === null || currentPage <= 0) {
      currentPage = 1;
    }
    const { data } = await $authHost.post("api/chart/charts", {
      filter_tag: filterTag,
      filter_value: String(filterValue),
      current_page: currentPage,
    });
    if (data.data === null || data.data.length === 0) {
      return [];
    }
    return data.data;
  } catch (e) {
    throw e;
  }
};

export const deleteGraph = async (id) => {
  try {
    await $authHost.delete(`api/chart/${id}`);
  } catch (e) {
    if (e.response.status === 527) {
      throw new Error(e.response.data.message);
    }
    throw e;
  }
};

export const getParSets = async (currentPage = 1) => {
  try {
    const { data } = await $authHost.post("api/chart/parSets", {
      current_page: currentPage,
    });
    if (data.data === null || data.data.length === 0) {
      return [];
    }
    return data.data;
  } catch (e) {
    throw e;
  }
};

export const getParSetsPageCount = async () => {
  try {
    const pageCount = await $authHost.get("api/chart/parSetsPageCount");
    return pageCount.data.pageCount;
  } catch (e) {
    throw e;
  }
};

export const createParSet = async (a, b, noiseMean, noiseStdev, falseWarningProb, missingDangerProb) => {
  try {
    const { data } = await $authHost.post("api/chart/parSet", {
      a: parseFloat(a),
      b: parseFloat(b),
      noise_mean: parseFloat(noiseMean),
      noise_stdev: parseFloat(noiseStdev),
      false_warning_prob: parseFloat(falseWarningProb),
      missing_danger_prob: parseFloat(missingDangerProb),
    });
    return data;
  } catch (e) {
    throw e;
  }
};
