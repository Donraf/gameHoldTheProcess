export class ChartData {
    constructor(
        maxPointsToShow = 10, // Сколько точек показывать на графике
        criticalValue = 0.9, // Критическое значение процесса
        checkDangerNum = 3 // На сколько шагов вперед смотреть, чтобы выявлять опасность
    ) {
        this.score = 0
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
        this.score += 10
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

    isCrashed() {
        if (this.points.length <= this.checkDangerNum) {
            return false
        }
        return this.points[this.points.length - this.checkDangerNum - 1].y >= this.criticalValue
    }

    isPointCrashed(index = this.data.datasets[0].data.length - 1) {
        return this.points[index].y >= this.criticalValue
    }

    isDanger() {
        for (let i = this.points.length - 1; i > this.points.length - this.checkDangerNum - 1 && i >= 0; i--) {
            if (this.isPointCrashed(i)) {
                this.points[this.points.length - this.checkDangerNum - 1].is_ai_signal = true
                return true
            }
        }
        return false
    }

    restart() {
        this.initData()
    }

    initData() {
        this.curIndex = 0;
        this.points = Array.from({ length: this.checkDangerNum }, () => {
            let newPoint = this.generatePoint()
            while (newPoint.y >= this.criticalValue) {
                newPoint = this.generatePoint()
            }
            this.curIndex += 1
            return newPoint;
        });
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

    chartStopped(){
        if (this.points.length > this.checkDangerNum) {
            this.points[this.points.length - this.checkDangerNum - 1].is_stop = true
            this.score = Math.ceil(this.score * 0.8)
        }
    }

    chartCrashed(){
        if (this.points.length > this.checkDangerNum) {
            this.points[this.points.length - this.checkDangerNum - 1].is_crash = true
            this.score = Math.ceil(this.score * 0.2)
        }
    }

}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.is_end = false;
        this.is_crash = false;
        this.is_ai_signal = false;
        this.is_stop = false;
        this.is_check = false;
    }
}