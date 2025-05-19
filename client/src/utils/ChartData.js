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
                    borderColor: 'rgb(0, 0, 0)',
                    borderWidth: 2,
                    fill: false,
                    data: pointsToShow.map( point => { return point.y } ),
                },
                {
                    type: 'line',
                    label: 'Критическое значение процесса',
                    borderColor: 'rgb(255, 0, 60)',
                    borderWidth: 2,
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

    /*
    * Генерация новой точки.
    * */
    generatePoint() {
        let newVal = 0
        if (this.points.length > 0) {
            newVal = this.points[this.points.length - 1].y;
            const randomVal = Math.random()
            if (randomVal >= 0.4) {
                newVal += Math.random() * 0.1
            } else {
                newVal -= Math.random() * 0.1
            }
            if (newVal < 0) newVal = 0
        }
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