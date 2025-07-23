import {COLORS} from "./constants";

export class ChartData {
    initialScore = 1000;
    bonusStep = 0;
    bonusRejectIncorrectAdvice = 800;
    bonusAcceptCorrectAdvice = 200;
    bonusCorrectStopNoAdvice = 800;
    penaltyRejectCorrectAdvice = 800;
    penaltyAcceptIncorrectAdvice = 800;
    penaltyIncorrectStopNoAdvice = 800;
    penaltyExplosionNoAdvice = 600;
    penaltyPause = 50;

    constructor(
        maxPointsToShow = 10, // Сколько точек показывать на графике
        criticalValue = 0.9, // Критическое значение процесса
        checkDangerNum = 3, // На сколько шагов вперед смотреть, чтобы выявлять опасность
        falseWarningProb = 0.1, // Вероятность ложной тревоги от системы ИИ
        missingDangerProb = 0.1, // Вероятность пропуска опасности системой ИИ
    ) {
        this.score = this.initialScore;
        this.curIndex = 0;
        this.maxPointsInSet = maxPointsToShow + checkDangerNum;
        this.criticalValue = criticalValue;
        this.checkDangerNum = checkDangerNum;
        this.falseWarningProb = falseWarningProb;
        this.missingDangerProb = missingDangerProb;
        this.shouldSentAlert = true
        this.wasExplosion = false
        this.wasManualStop = false
        this.wasRealAlert = false
        this.wasFakeAlert = false
        this.restart()
    }

    generateNextPoint () {
        if (this.wasFakeAlert) {
            this.wasFakeAlert = false
            this.score += this.bonusRejectIncorrectAdvice
        }
        this.points.push(this.generatePoint())
        this.curIndex += 1
        this.score += this.bonusStep
        let pointsToShow
        if (this.points.length > this.maxPointsInSet) {
            pointsToShow = this.points.slice(-this.maxPointsInSet, -this.checkDangerNum)
        } else {
            const end = this.checkDangerNum >= this.points.length ? 0 : -this.checkDangerNum
            pointsToShow = this.points.slice(0, end)
        }

        this.data = {
            labels: pointsToShow.map( point => { return point.x }),
            datasets: [
                {
                    type: 'line',
                    label: 'Значение процесса',
                    borderColor: function(context) {
                        const chart = context.chart;
                        const {ctx, chartArea} = chart;
                        if (!chartArea) {
                            // This case happens on initial chart load
                            return;
                        }
                        return getGradient(ctx, chartArea);
                    },
                    borderWidth: 4,
                    fill: false,
                    data: pointsToShow.map( point => { return point.y } ),
                },
                {
                    type: 'line',
                    label: 'Критическое значение процесса',
                    borderColor: COLORS.graphGradientHigh,
                    borderWidth: 4,
                    fill: false,
                    data: pointsToShow.map( () => { return this.criticalValue } ),
                }
            ]
        }

        this.fullData = {
            labels: this.points.slice(0, -this.checkDangerNum).map( point => { return point.x }),
            datasets: [
                {
                    type: 'line',
                    label: 'Значение процесса',
                    borderColor: function(context) {
                        const chart = context.chart;
                        const {ctx, chartArea} = chart;
                        if (!chartArea) {
                            // This case happens on initial chart load
                            return;
                        }
                        return getGradient(ctx, chartArea);
                    },
                    borderWidth: 4,
                    fill: false,
                    data: this.points.slice(0, -this.checkDangerNum).map( point => { return point.y } ),
                },
                {
                    type: 'line',
                    label: 'Критическое значение процесса',
                    borderColor: COLORS.graphGradientHigh,
                    borderWidth: 4,
                    fill: false,
                    data: this.points.slice(0, -this.checkDangerNum).map( () => { return this.criticalValue } ),
                }
            ]
        }
    }

    /*
    * Генерация новой точки.
    * Переходная функция звена первого порядка + шум.
    * */
    generatePoint() {
        let k = .92
        let T = 20
        let newVal = (k * (1 - Math.exp(-this.points.length / T)) +
            (Math.random() * 2 - 1) * 0.03).toFixed(2)
        if (newVal < 0) newVal = 0
        return new Point(this.curIndex, newVal)
    }

    /*
    * Проверка точки по указанному индексу на то, выходит ли в ней значение за критическое.
    * По умолчанию проверяется текущая точка.
    * */
    isCrashed(index = this.points.length - this.checkDangerNum - 1) {
        if (index >= this.points.length || index < 0) {
            return false
        }
        return this.points[index].y >= this.criticalValue
    }

    isDanger() {
        if (!this.shouldSentAlert) return false
        const randomVal = Math.random()
        if (this.isRealDanger()) {
            this.shouldSentAlert = false
            if (randomVal >= this.missingDangerProb) {
                this.points[this.points.length - this.checkDangerNum - 1].is_ai_signal = true
                this.wasRealAlert = true
                this.points[this.points.length - this.checkDangerNum - 1].is_useful_ai_signal = true
                return true
            } else {
                return false
            }
        }

        if (this.points.length <= this.checkDangerNum
            || this.points[this.points.length - this.checkDangerNum].y < 0.85 * this.criticalValue) {
            return
        }

        if (randomVal >= this.falseWarningProb) {
            return false
        } else {
            this.points[this.points.length - this.checkDangerNum - 1].is_ai_signal = true
            this.wasFakeAlert = true
            this.points[this.points.length - this.checkDangerNum - 1].is_deceptive_ai_signal = true
            return true
        }
    }

    isRealDanger() {
        const end = this.points.length - 1;
        let start = this.points.length - this.checkDangerNum - 1;
        if (start < 0) start = 0;
        for (let i = end; i > start; i--) {
            if (this.isCrashed(i)) {
                return true
            }
        }
        return false
    }

    restart() {
        this.changeEndGameScore()

        this.points = [];
        this.curIndex = 0;
        this.shouldSentAlert = true;
        this.wasExplosion = false;
        this.wasManualStop = false;
        this.wasRealAlert = false;
        this.wasFakeAlert = false;
        for (let i = 0; i < this.checkDangerNum + 1; i++) {
            this.generateNextPoint()
        }
    }

    chartStopped(){
        let isStopNeeded = this.isRealDanger()
        if (this.points.length > this.checkDangerNum) {
            this.points[this.points.length - this.checkDangerNum - 1].is_stop = true
            this.wasManualStop = true
        }
        return isStopNeeded
    }

    chartCrashed(){
        if (this.points.length > this.checkDangerNum) {
            this.points[this.points.length - this.checkDangerNum - 1].is_crash = true
            this.wasExplosion = true
        }
    }

    chartPaused() {
        this.score -= this.penaltyPause
        this.points[this.points.length - this.checkDangerNum - 1].is_pause = true
    }

    chartHintUsed(cost) {
        this.score -= cost
        this.points[this.points.length - this.checkDangerNum - 1].is_check = true
    }

    changeEndGameScore() {
        if (this.wasExplosion && this.wasRealAlert) {
            this.score -= this.penaltyRejectCorrectAdvice
            return
        }

        if (this.wasExplosion && !this.wasRealAlert) {
            this.score -= this.penaltyExplosionNoAdvice
            return
        }

        if (this.wasManualStop && this.isRealDanger()) {
            if (this.wasRealAlert) {this.score += this.bonusAcceptCorrectAdvice} else {this.score += this.bonusCorrectStopNoAdvice}
            return
        }

        if (this.wasManualStop && !this.isRealDanger()) {
            if (this.wasFakeAlert) {this.score -= this.penaltyAcceptIncorrectAdvice} else {this.score -= this.penaltyIncorrectStopNoAdvice}
            return
        }
    }

    restoreFromPoints(points) {
        let newPoints = [];
        for (let i in points) {
            let newPoint = new Point(
                points[i].x,
                points[i].y,
                points[i].is_end,
                points[i].is_crash,
                points[i].is_useful_ai_signal,
                points[i].is_deceptive_ai_signal,
                points[i].is_stop,
                points[i].is_pause,
                points[i].is_check,
            )
            newPoints.push(newPoint)
        }

        this.data = {
            labels: newPoints.map( point => { return point.x }),
            datasets: [
                {
                    type: 'line',
                    label: 'Значение процесса',
                    borderColor: function(context) {
                        const chart = context.chart;
                        const {ctx, chartArea} = chart;
                        if (!chartArea) {
                            // This case happens on initial chart load
                            return;
                        }
                        return getGradient(ctx, chartArea);
                    },
                    borderWidth: 4,
                    fill: false,
                    data: newPoints.map( point => { return point.y } ),
                },
                {
                    type: 'line',
                    label: 'Критическое значение процесса',
                    borderColor: COLORS.graphGradientHigh,
                    borderWidth: 4,
                    fill: false,
                    data: newPoints.map( () => { return this.criticalValue } ),
                }
            ]
        }
    }

}

class Point {
    constructor(x, y, is_end=false, is_crash=false, is_useful_ai_signal=false, is_deceptive_ai_signal=false,
                is_stop=false, is_pause=false, is_check=false) {
        this.x = x;
        this.y = y;
        this.is_end = is_end;
        this.is_crash = is_crash;
        this.is_useful_ai_signal = is_useful_ai_signal;
        this.is_deceptive_ai_signal = is_deceptive_ai_signal;
        this.is_stop = is_stop;
        this.is_pause = is_pause;
        this.is_check = is_check;
    }
}

let width, height, gradient;
function getGradient(ctx, chartArea) {
    const chartWidth = chartArea.right - chartArea.left;
    const chartHeight = chartArea.bottom - chartArea.top;
    if (!gradient || width !== chartWidth || height !== chartHeight) {
        // Create the gradient because this is either the first render
        // or the size of the chart has changed
        width = chartWidth;
        height = chartHeight;
        gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
        gradient.addColorStop(0, COLORS.graphGradientLow);
        gradient.addColorStop(0.5, COLORS.graphGradientMiddle);
        gradient.addColorStop(1, COLORS.graphGradientHigh);
    }
    return gradient;
}