export class ChartData {
    constructor(initIndex = 0, maxPointsInSet = 10, criticalValue = 0.9, checkDangerNum = 3) {
        this.curIndex = initIndex;
        this.maxPointsInSet = maxPointsInSet;
        this.criticalValue = criticalValue;
        this.checkDangerNum = checkDangerNum;
        this.points = [];
        this.data = {
            labels: this.points.map( point => { return point.x }),
            datasets: [
                {
                    type: 'line',
                    label: 'Значение процесса',
                    borderColor: 'rgb(0, 0, 0)',
                    borderWidth: 2,
                    fill: false,
                    data: this.points.map( point => { return point.y } ),
                },
                {
                    type: 'line',
                    label: 'Критическое значение процесса',
                    borderColor: 'rgb(255, 0, 60)',
                    borderWidth: 2,
                    fill: false,
                    data: this.points.map( point => { return this.criticalValue } ),
                }
            ]
        }
    }

    generateNextSet () {
        if (this.points.length >= this.maxPointsInSet) {
            this.points.shift()
        }
        this.points.push(new Point(this.curIndex, Math.random()))
        this.curIndex += 1
        this.data = {
            labels: this.points.map( point => { return point.x }),
            datasets: [
                {
                    type: 'line',
                    label: 'Значение процесса',
                    borderColor: 'rgb(0, 0, 0)',
                    borderWidth: 2,
                    fill: false,
                    data: this.points.map( point => { return point.y } ),
                },
                {
                    type: 'line',
                    label: 'Критическое значение процесса',
                    borderColor: 'rgb(255, 0, 60)',
                    borderWidth: 2,
                    fill: false,
                    data: this.points.map( point => { return this.criticalValue } ),
                }
            ]
        }
        return this.data
    }

    // getCurrentValue() {
    //     return this.data.datasets[]
    // }
    //
    // getCriticalValue() {
    //     return this.criticalValue
    // }

    isCrashed(index = this.data.datasets[0].data.length - 1) {
        return this.data.datasets[0].data[index] >= this.criticalValue
    }

    isDanger() {
        let isDanger = false;
        for (let i = this.points.length - 1; i > this.points.length - this.checkDangerNum - 1 && i >= 0; i--) {
            isDanger = isDanger || this.isCrashed(i);
        }
    }

}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}