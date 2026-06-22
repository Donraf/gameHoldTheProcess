import React from "react";
import { Button, Typography } from "@mui/material";
import GameModal from "./GameModal";

const backButtonSx = {
  color: "#FFFFFF",
  backgroundColor: "#9356A0",
  flexGrow: 1,
};

export default function RulesModal({ open, onClose }) {
  return (
    <GameModal open={open} onClose={onClose} contentSx={{ height: "90%", width: 800, overflow: "scroll" }}>
      <Typography>Описание игры "Удержи процесс!"</Typography>
      <Typography>
        Вы – оператор атомной электростанции. Состояние процесса демонстрирует график, поступающий на монитор. Если его
        уровень превысит 1.0, это приведет к катастрофическому взрыву. При угрозе взрыва искусственный интеллект подаёт
        сигнал, однако неизбежны и ложные тревоги. При сигнале Вы можете:
      </Typography>
      <Typography>• завершить процесс (вернуть в ноль);</Typography>
      <Typography>• продолжить процесс, если Вы сочли тревогу ложной;</Typography>
      <Typography>
        • предварительно получить дополнительную информацию о степени риска ("Риск очень высок"; "Умеренный риск";
        "Невысокий уровень риска").
      </Typography>
      <Typography>За каждый шаг Вы получаете 50 очков.</Typography>
      <Typography>Дополнительная информация требует затраты ресурсов. За ее запрос снимается 250 очков.</Typography>
      <img src="scoresTable.png" alt="Таблица очков" />
      <Typography>
        Период игры до завершения процесса или взрыва – это ГЕЙМ. При взрыве он считается ПРОИГРАННЫМ и положительные
        очки аннулируются. Штраф с подсказкой 4000 очков, без подсказки - 2000 очков. Если взрыва не было, то гейм
        ПРОЙДЕН УСПЕШНО и положительные очки сохраняются.
      </Typography>
      <Typography>
        РЕЗУЛЬТАТЫ ИГРЫ – это число успешно пройденных геймов (в соотношении с проигранными), а также набранная сумма
        очков.
      </Typography>
      <Typography>Стрелочки позволяют убыстрить / замедлить процесс, кнопка "Пауза" приостанавливает его.</Typography>
      <Typography>
        До начала игры Вам предлагается ТРЕНИРОВОЧНАЯ СЕССИЯ (не более 15 минут). В любой момент Вы можете перейти к
        основной игре (она закончится через 60 минут).
      </Typography>
      <Typography>УДАЧНОЙ ИГРЫ!</Typography>
      <Button sx={backButtonSx} onClick={onClose}>
        К игре
      </Button>
    </GameModal>
  );
}
