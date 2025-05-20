import dateFormat from "dateformat";

export const transformToUiDateDayTime = (date) => {
    return dateFormat(date, "dd.mm.yyyy hh:MM")
}