export const getRemTime = (time_start, time_limit) => {
  if (time_start == null) {
    return millisToMinutesAndSeconds(time_limit);
  }

  let startDate = new Date(time_start);
  const diffTime = Date.now() - startDate.getTime() + 3 * 60 * 60 * 1000;

  if (diffTime > time_limit) {
    return millisToMinutesAndSeconds(0);
  }

  return millisToMinutesAndSeconds(time_limit - diffTime);
};

export const getRemTimeRaw = (time_start, time_limit) => {
  if (time_start == null) {
    return time_limit;
  }

  let startDate = new Date(time_start);
  const diffTime = Date.now() - startDate.getTime() + 3 * 60 * 60 * 1000;

  if (diffTime > time_limit) {
    return 0;
  }

  return time_limit - diffTime;
};

export const millisToMinutesAndSeconds = (millis) => {
  var minutes = Math.floor(millis / 60000);
  var seconds = Math.floor((millis % 60000) / 1000)
  return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
};
