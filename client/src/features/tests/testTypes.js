export const TEST_TYPE_LIKERT = "likert";
export const TEST_TYPE_SINGLE_CHOICE = "single_choice";
export const TEST_TYPE_TEXT = "text";

export const TEST_CONFIG_EXAMPLES = {
  [TEST_TYPE_LIKERT]: {
    scale: {
      min: 1,
      max: 4,
      labels: {
        "1": "Редко или никогда",
        "2": "Иногда",
        "3": "Часто",
        "4": "Всегда или почти всегда",
      },
    },
    questions: [
      {
        id: "q1",
        text: "Я ерзаю во время представлений и лекций.",
      },
      {
        id: "q2",
        text: "Мне бывает сложно усидеть на месте в театре или на лекциях.",
      },
    ],
  },
  [TEST_TYPE_SINGLE_CHOICE]: {
    questions: [
      {
        id: "monitoring_experience",
        text: "Каков ваш опыт работы с системами мониторинга?",
        options: ["Нет опыта", "Меньше года", "1-3 года", "Более 3 лет"],
      },
    ],
  },
  [TEST_TYPE_TEXT]: {
    questions: [
      {
        id: "expectations",
        text: "Какие у вас ожидания от участия в исследовании?",
      },
    ],
  },
};

export const TEST_TYPE_OPTIONS = [
  { value: TEST_TYPE_LIKERT, label: "Шкала Лайкерта" },
  { value: TEST_TYPE_SINGLE_CHOICE, label: "Один вариант ответа" },
  { value: TEST_TYPE_TEXT, label: "Текстовые ответы" },
];

export function parseTestConfig(config) {
  if (typeof config === "string") {
    return JSON.parse(config);
  }
  return config;
}
