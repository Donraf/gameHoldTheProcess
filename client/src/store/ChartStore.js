import {makeAutoObservable} from "mobx";
import {ChartData} from "../utils/ChartData";

export default class ChartStore {
    constructor() {
        this._chartData = new ChartData();
        makeAutoObservable(this);
    }

    get chartData() {
        return this._chartData;
    }

}