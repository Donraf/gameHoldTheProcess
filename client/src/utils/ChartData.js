export class ChartData {
    constructor(initIndex = 0, maxPointsInSet = 10) {
        this.curIndex = initIndex;
        this.maxPointsInSet = maxPointsInSet;
        this.points = [];
        this.data = {
            labels: this.points.map( point => { return point.x }),
            datasets: [
                {
                    type: 'line',
                    label: 'Dataset 1',
                    borderColor: 'rgb(255, 99, 132)',
                    borderWidth: 2,
                    fill: false,
                    data: this.points.map( point => { return point.y } ),
                }
            ]
        }
    }

    generateNextSet () {
        console.log("this.points")
        console.log(this.points)
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
                    label: 'Dataset 1',
                    borderColor: 'rgb(255, 99, 132)',
                    borderWidth: 2,
                    fill: false,
                    data: this.points.map( point => { return point.y } ),
                }
            ]
        }
        return this.data
    }
}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}