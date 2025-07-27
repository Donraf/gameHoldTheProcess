import {makeAutoObservable} from "mobx";

export default class NavBarStore {
    constructor() {
        this._selectedPage = "";
        makeAutoObservable(this);
    }

    setSelectedPage(selectedPage) {
        this._selectedPage = selectedPage;
    }

    get selectedPage() {
        return this._selectedPage;
    }
}
