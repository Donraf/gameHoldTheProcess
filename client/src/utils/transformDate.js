import dateFormat from "dateformat";

export const transformToUiDateDayTime = (date) => {
  return dateFormat(date, "dd.mm.yyyy hh:MM");
};

export const transformToDbDateDayTime = (date) => {
  return dateFormat(date, "yyyy-mm-dd'T'HH:MM:ss'Z'");
};
