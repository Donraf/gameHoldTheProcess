export class ChartData {
    constructor(
        maxPointsToShow = 10, // Сколько точек показывать на графике
        criticalValue = 0.9, // Критическое значение процесса
        checkDangerNum = 3 // На сколько шагов вперед смотреть, чтобы выявлять опасность
    ) {
        this.curIndex = 0;
        this.maxPointsInSet = maxPointsToShow + checkDangerNum;
        this.criticalValue = criticalValue;
        this.checkDangerNum = checkDangerNum;
        this.initData()
    }

    generateNextSet () {
        if (this.points.length >= this.maxPointsInSet) {
            this.points.shift()
        }
        this.points.push(this.generatePoint())
        this.curIndex += 1
        this.data = {
            labels: this.points.slice(0, -this.checkDangerNum).map( point => { return point.x }),
            datasets: [
                {
                    type: 'line',
                    label: 'Значение процесса',
                    borderColor: 'rgb(0, 0, 0)',
                    borderWidth: 2,
                    fill: false,
                    data: this.points.slice(0, -this.checkDangerNum).map( point => { return point.y } ),
                },
                {
                    type: 'line',
                    label: 'Критическое значение процесса',
                    borderColor: 'rgb(255, 0, 60)',
                    borderWidth: 2,
                    fill: false,
                    data: this.points.slice(0, -this.checkDangerNum).map( () => { return this.criticalValue } ),
                }
            ]
        }
        return this.data
    }

    generatePoint() {
        return new Point(this.curIndex, Math.random())
    }

    // getCurrentValue() {
    //     return this.data.datasets[]
    // }
    //
    // getCriticalValue() {
    //     return this.criticalValue
    // }

    isCrashed(index = this.data.datasets[0].data.length - 1) {
        return this.points[index].y >= this.criticalValue
    }

    isDanger() {
        for (let i = this.points.length - 1; i > this.points.length - this.checkDangerNum - 1 && i >= 0; i--) {
            if (this.isCrashed(i)) return true
        }
        return false
    }

    restart() {
        this.initData()
    }

    initData() {
        this.points = Array.from({ length: this.checkDangerNum }, () => this.generatePoint());
        this.data = {
            labels: this.points.slice(0, -this.checkDangerNum).map( point => { return point.x }),
            datasets: [
                {
                    type: 'line',
                    label: 'Значение процесса',
                    borderColor: 'rgb(0, 0, 0)',
                    borderWidth: 2,
                    fill: false,
                    data: this.points.slice(0, -this.checkDangerNum).map( point => { return point.y } ),
                },
                {
                    type: 'line',
                    label: 'Критическое значение процесса',
                    borderColor: 'rgb(255, 0, 60)',
                    borderWidth: 2,
                    fill: false,
                    data: this.points.slice(0, -this.checkDangerNum).map( () => { return this.criticalValue } ),
                }
            ]
        }
    }

}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}