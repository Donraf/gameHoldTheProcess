import { COLORS } from "./constants";

export class ChartData {
// Бонусы
  bonusStep = 50; // Бонус за шаг
  bonusRejectIncorrectAdviceWithCheck = 1000; // Бонус за отклонение ложной тревоги от ИИ с подсказкой
  bonusRejectIncorrectAdviceNoCheck = 2000; // Бонус за отклонение ложной тревоги от ИИ без подсказки
  bonusAcceptCorrectAdviceWithCheck = 250; // Бонус за принятие правильного совета ИИ с подсказкой
  bonusAcceptCorrectAdviceNoCheck = 500; // Бонус за принятие правильного совета ИИ без подсказки
  // Штрафы
  penaltyRejectCorrectAdviceWithCheck = 4000; // Штраф взрыва при отклонении правильного совета ИИ с подсказкой
  penaltyRejectCorrectAdviceNoCheck = 2000; // Штраф взрыва при отклонении правильного совета ИИ без подсказки
  penaltyAcceptIncorrectAdviceWithCheck = 2000; // Штраф остановки при ложной тревоге от ИИ с подсказкой
  penaltyAcceptIncorrectAdviceNoCheck = 1000; // Штраф остановки при ложной тревоге от ИИ без подсказки
  penaltyIncorrectStopNoAdvice = 2000; // Штраф за неправильный останов без совета ИИ
  penaltyExplosionNoAdvice = 0; // Штраф взрыва без совета совета ИИ (пропуск цели оператором)
  penaltyPause = 50; // Штраф за паузу

  constructor(
    maxPointsToShow = 30, // Сколько точек показывать на графике
    criticalValue = 1.0, // Критическое значение процесса
    checkDangerNum = 1, // На сколько шагов вперед смотреть, чтобы выявлять опасность
    falseWarningProb = 0, // Вероятность ложной тревоги от системы ИИ
    missingDangerProb = 0, // Вероятность пропуска опасности системой ИИ
    parSet = null,
    score = 0
  ) {
    this.U = 1.0;
    this.score = score;
    this.curIndex = 0;
    this.maxPointsToShow = maxPointsToShow;
    this.maxPointsInSet = maxPointsToShow + checkDangerNum;
    this.criticalValue = criticalValue;
    this.checkDangerNum = checkDangerNum;
    this.falseWarningProb = falseWarningProb;
    this.missingDangerProb = missingDangerProb;
    this.shouldSentAlert = true;
    this.wasExplosion = false;
    this.wasManualStop = false;
    this.wasRealAlert = false;
    this.wasFakeAlert = false;
    this.parSet = parSet;
    this.falseAlarmThreshold = 0.75;
    this.restart();
  }

  generateNextPoint(shouldChangeScore = true) {
    if (this.wasFakeAlert && shouldChangeScore) {
      if (this.points[this.points.length - this.checkDangerNum - 1].is_check) {
        this.score += this.bonusRejectIncorrectAdviceWithCheck;
      } else {
        this.score += this.bonusRejectIncorrectAdviceNoCheck;
      }
    }
    this.points.push(this.generatePoint());
    if (this.wasFakeAlert) {
      this.wasFakeAlert = false;
      this.points[this.points.length - this.checkDangerNum - 1].score += this.bonusRejectIncorrectAdvice;
    }
    this.curIndex += 1;
    if (this.curIndex >= this.checkDangerNum && shouldChangeScore) {
      this.score += this.bonusStep;
    }
    let pointsToShow;
    if (this.points.length > this.maxPointsInSet) {
      pointsToShow = this.points.slice(-this.maxPointsInSet, -this.checkDangerNum);
    } else {
      const end = this.checkDangerNum >= this.points.length ? 0 : -this.checkDangerNum;
      pointsToShow = this.points.slice(0, end);
    }

    this.data = this.formData(pointsToShow);
    this.fullData = this.formData(this.points.slice(0, -this.checkDangerNum));
  }

  /*
   * Генерация новой точки.
   * Звено первого порядка + шум.
   * */
  generatePoint() {
    if (this.curIndex === 0 || this.parSet === null) {
      return new Point(this.curIndex, 0, this.score);
    }
    let a = this.parSet.a;
    let b = this.parSet.b;
    let noise_mean = this.parSet.noise_mean;
    let noise_stdev = this.parSet.noise_stdev;
    let noise = gaussianRandom(noise_mean, noise_stdev);
    let newVal = a * this.points[this.points.length - this.checkDangerNum].y + b * this.U + parseFloat(noise);
    return new Point(this.curIndex, newVal, this.score);
  }

  /*
   * Проверка точки по указанному индексу на то, выходит ли в ней значение за критическое.
   * По умолчанию проверяется текущая точка.
   * */
  isCrashed(index = this.points.length - this.checkDangerNum - 1) {
    if (index >= this.points.length || index < 0) {
      return false;
    }
    return this.points[index].y >= this.criticalValue;
  }

  isDanger() {
    const randomVal = Math.random();
    if (!this.shouldSentAlert) return false;
    if (this.isRealDanger()) {
      this.shouldSentAlert = false;
      this.points[this.points.length - this.checkDangerNum - 1].is_ai_signal = true;
      this.wasRealAlert = true;
      this.points[this.points.length - this.checkDangerNum - 1].is_useful_ai_signal = true;
      return true;
      // Пропуск цели
      // if (randomVal >= this.missingDangerProb) {
      //   this.points[this.points.length - this.checkDangerNum - 1].is_ai_signal = true;
      //   this.wasRealAlert = true;
      //   this.points[this.points.length - this.checkDangerNum - 1].is_useful_ai_signal = true;
      //   return true;
      // } else {
      //   return false;
      // }
    }

    if (
      this.points.length <= this.checkDangerNum ||
      this.points[this.points.length - this.checkDangerNum - 1].y < this.falseAlarmThreshold * this.criticalValue
    ) {
      return;
    }

    if (
      randomVal < this.falseWarningProb
    ) {
      this.points[this.points.length - this.checkDangerNum - 1].is_ai_signal = true;
      this.wasFakeAlert = true;
      this.points[this.points.length - this.checkDangerNum - 1].is_deceptive_ai_signal = true;
      return true;
    } else {
      return false;
    }
  }

  isRealDanger() {
    const end = this.points.length - 1;
    let start = this.points.length - this.checkDangerNum - 1;
    if (start < 0) start = 0;
    for (let i = end; i > start; i--) {
      if (this.isCrashed(i)) {
        return true;
      }
    }
    return false;
  }

  restart() {
    this.score = 0;
    this.points = [];
    this.curIndex = 0;
    this.shouldSentAlert = true;
    this.wasExplosion = false;
    this.wasManualStop = false;
    this.wasRealAlert = false;
    this.wasFakeAlert = false;
    for (let i = 0; i < this.maxPointsToShow; i++) {
      this.points.push(new Point(0, null, this.score));
    }

    for (let i = 0; i < this.checkDangerNum + 1; i++) {
      this.generateNextPoint();
    }
  }

  chartStopped() {
    let isStopNeeded = this.isRealDanger();
    if (this.points.length > this.checkDangerNum) {
      this.points[this.points.length - this.checkDangerNum - 1].is_stop = true;
      this.wasManualStop = true;
    }
    return isStopNeeded;
  }

  chartCrashed() {
    if (this.points.length > this.checkDangerNum) {
      this.points[this.points.length - this.checkDangerNum - 1].is_crash = true;
      this.wasExplosion = true;
    }
  }

  chartPaused() {
    this.score -= this.penaltyPause;
    this.points[this.points.length - this.checkDangerNum - 1].is_pause = true;
    this._updateMidScores();
  }

  chartHintUsed(cost, hintText) {
    this.score -= cost;
    this.points[this.points.length - this.checkDangerNum - 1].is_check = true;
    this.points[this.points.length - this.checkDangerNum - 1].check_info = hintText;
    this._updateMidScores();
  }

  _updateMidScores() {
    this.points[this.points.length - this.checkDangerNum - 1].score = this.score - 2 * this.bonusStep;
    this.points[this.points.length - this.checkDangerNum].score = this.score - 1 * this.bonusStep;
  }

  _updateEndScores() {
    for (let i = this.points.length - this.checkDangerNum - 1; i < this.points.length; i++) {
      this.points[i].score = this.score;
    }
  }

  computeEndGameScore() {
    const hintUsed = this.points[this.points.length - this.checkDangerNum - 1].is_check;
    if (this.wasExplosion && this.wasRealAlert) {
      // Взрыв с предупреждением от ИИ
      if (this.score > 0) { 
        this.score = 0 }
      if (this.points[this.points.length - this.checkDangerNum - 2].is_check) {
        this.score -= this.penaltyRejectCorrectAdviceWithCheck;
      } else {
        this.score -= this.penaltyRejectCorrectAdviceNoCheck;
      }
    // } else if (this.wasExplosion && !this.wasRealAlert) {
    //   // Взрыв без предупреждения от ИИ
    //   this.score = -this.penaltyExplosionNoAdvice;
    } else if (this.wasManualStop && this.isRealDanger() && this.wasRealAlert) {
      // Правильная остановка с предупреждением от ИИ
      if (hintUsed) {
        this.score += this.bonusAcceptCorrectAdviceWithCheck - 2 * this.bonusStep;
      } else {
        this.score += this.bonusAcceptCorrectAdviceNoCheck - 2 * this.bonusStep;
      }
    } else if (this.wasManualStop && !this.isRealDanger() && this.wasFakeAlert) {
      // Неправильная остановка с ложным предупреждением от ИИ
      if (hintUsed) {
        this.score -= this.penaltyAcceptIncorrectAdviceWithCheck + 2 * this.bonusStep;
      } else {
        this.score -= this.penaltyAcceptIncorrectAdviceNoCheck + 2 * this.bonusStep;
      }
    }
    // } else if (this.wasManualStop && !this.isRealDanger() && !this.wasFakeAlert) {
    //   // Неправильная остановка без предупреждения от ИИ
    //   this.score -= this.penaltyIncorrectStopNoAdvice + 2 * this.bonusStep;
    // }

    this._updateEndScores();

    return this.score;
  }

  restoreFromPoints(points) {
    let newPoints = [];
    for (let i in points) {
      let newPoint = new Point(
        points[i].x,
        points[i].y,
        points[i].score,
        points[i].is_crash,
        points[i].is_useful_ai_signal,
        points[i].is_deceptive_ai_signal,
        points[i].is_stop,
        points[i].is_pause,
        points[i].is_check
      );
      newPoints.push(newPoint);
    }

    this.data = this.formData(newPoints);
  }

  setParSet(parSet) {
    this.parSet = parSet;
    this.missingDangerProb = parSet.missing_danger_prob;
    this.falseWarningProb = parSet.false_warning_prob;
    this.restart();
  }

  getCrashProb() {
    if (this.parSet === null) {
      return 0;
    }
    var cdf = require("@stdlib/stats-base-dists-normal-cdf");
    let a = this.parSet.a;
    let b = this.parSet.b;
    let noise_mean = this.parSet.noise_mean;
    let noise_stdev = this.parSet.noise_stdev;
    let knownPart = a * this.points[this.points.length - this.checkDangerNum - 1].y + b * this.U;
    let crashProb = (1 - cdf(this.criticalValue - knownPart, parseFloat(noise_mean), parseFloat(noise_stdev))) * 100;
    return crashProb;
  }

  LOW_RISK_LEVEL = "Низкий уровень риска"
  MODERATE_RISK_LEVEL = "Средний уровень риска"
  HIGH_RISK_LEVEL = "Высокий уровень риска"
  getCrashProbApprox() {
    if (this.parSet === null) {
      return this.LOW_RISK_LEVEL;
    }
    let noise_stdev = this.parSet.noise_stdev;
    let z = this.points[this.points.length - this.checkDangerNum - 1].y
    if (this.isRealDanger()) {
      z = 0.5 * z + 0.5;
    } else {
      z = 1.5 * z - 0.5;
    }
    let critDiff = this.criticalValue - z
    if (critDiff >= 2.5 * noise_stdev) {
      return this.LOW_RISK_LEVEL
    } else if (critDiff >= 2 * noise_stdev) {
      return this.MODERATE_RISK_LEVEL
    } else {
      return this.HIGH_RISK_LEVEL
    }
  }

  formData(dataPoints) {
    return {
      labels: dataPoints.map((point) => {
        return point.x;
      }),
      datasets: [
        {
          type: "line",
          label: "Значение процесса",
          borderColor: function (context) {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) {
              // This case happens on initial chart load
              return;
            }
            return getGradient(ctx, chartArea);
          },
          borderWidth: 4,
          backgroundColor: function (ctx) {
            const val = ctx.dataset.data[ctx.dataset.data.length - 1];
            if (val <= 0.5) {
              return getGradientColor(COLORS.graphGradientLow, COLORS.graphGradientMiddle, val / 0.5);
            } else {
              return getGradientColor(
                COLORS.graphGradientMiddle,
                COLORS.graphGradientHigh,
                Math.min(1, (val - 0.5) / 0.4)
              );
            }
          },
          fill: true,
          data: dataPoints.map((point) => {
            return point.y;
          }),
        },
        {
          type: "line",
          label: "Критическое значение процесса",
          pointStyle: false,
          borderColor: COLORS.graphCriticalValue,
          borderWidth: 8,
          fill: false,
          data: dataPoints.map(() => {
            return this.criticalValue;
          }),
        },
      ],
    };
  }
}

class Point {
  constructor(
    x,
    y,
    score,
    is_crash = false,
    is_useful_ai_signal = false,
    is_deceptive_ai_signal = false,
    is_stop = false,
    is_pause = false,
    is_check = false
  ) {
    this.x = x;
    this.y = y;
    this.score = score;
    this.is_crash = is_crash;
    this.is_useful_ai_signal = is_useful_ai_signal;
    this.is_deceptive_ai_signal = is_deceptive_ai_signal;
    this.is_stop = is_stop;
    this.is_pause = is_pause;
    this.is_check = is_check;
    this.check_info = null;
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

function getGradientColor(start_color, end_color, percent) {
  start_color = start_color.replace(/^\s*#|\s*$/g, "");
  end_color = end_color.replace(/^\s*#|\s*$/g, "");

  const start_red = parseInt(start_color.substr(0, 2), 16),
    start_green = parseInt(start_color.substr(2, 2), 16),
    start_blue = parseInt(start_color.substr(4, 2), 16);

  const end_red = parseInt(end_color.substr(0, 2), 16),
    end_green = parseInt(end_color.substr(2, 2), 16),
    end_blue = parseInt(end_color.substr(4, 2), 16);

  let diff_red = end_red - start_red;
  let diff_green = end_green - start_green;
  let diff_blue = end_blue - start_blue;

  diff_red = (diff_red * percent + start_red).toString(16).split(".")[0];
  diff_green = (diff_green * percent + start_green).toString(16).split(".")[0];
  diff_blue = (diff_blue * percent + start_blue).toString(16).split(".")[0];

  if (diff_red.length === 1) diff_red = "0" + diff_red;
  if (diff_green.length === 1) diff_green = "0" + diff_green;
  if (diff_blue.length === 1) diff_blue = "0" + diff_blue;

  return "#" + diff_red + diff_green + diff_blue + "40";
}

// Standard Normal variate using Box-Muller transform.
function gaussianRandom(mean, stdev) {
  const u = 1 - Math.random(); // Converting [0,1) to (0,1]
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  // Transform to the desired mean and standard deviation:
  return z * parseFloat(stdev) + parseFloat(mean);
}
