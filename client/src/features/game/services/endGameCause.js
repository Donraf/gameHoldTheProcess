export function inferEndGameCause(points, criticalValue) {
  for (let i = 0; i < points.length; i++) {
    if (points[i].is_stop) {
      if (i - 1 < 0) {
        return "Остановка без предупреждения от ИИ (неправильная)";
      }
      if (points[i - 1].is_useful_ai_signal) {
        return "Остановка после правильного предупреждения от ИИ";
      }
      if (points[i - 1].is_deceptive_ai_signal) {
        return "Остановка после неправильного предупреждения от ИИ";
      }
      if (i + 1 >= points.length) {
        return "";
      }
      if (points[i + 1].y >= criticalValue) {
        return "Остановка без предупреждения от ИИ (правильная)";
      }
      return "Остановка без предупреждения от ИИ (неправильная)";
    }
    if (points[i].is_crash) {
      if (i - 1 < 0) {
        return "Взрыв без предупреждения от ИИ";
      }
      if (points[i - 1].is_useful_ai_signal) {
        return "Взрыв после отклонения правильного предупреждения от ИИ";
      }
      return "Взрыв без предупреждения от ИИ";
    }
  }
  return "";
}
