import { buildAnswerRows } from "./formatTestAnswers";
import { TEST_CONFIG_EXAMPLES, TEST_TYPE_LIKERT, TEST_TYPE_TEXT } from "./testTypes";

describe("buildAnswerRows", () => {
  describe("likert", () => {
    const config = JSON.stringify(TEST_CONFIG_EXAMPLES[TEST_TYPE_LIKERT]);

    it("formats answers with scale labels", () => {
      const rows = buildAnswerRows(TEST_TYPE_LIKERT, config, JSON.stringify({ q1: 2, q2: 4 }));

      expect(rows).toEqual([
        { number: 1, question: "Я ерзаю во время представлений и лекций.", answer: "2 — Иногда" },
        {
          number: 2,
          question: "Мне бывает сложно усидеть на месте в театре или на лекциях.",
          answer: "4 — Всегда или почти всегда",
        },
      ]);
    });

    it("renders a dash for missing answers", () => {
      const rows = buildAnswerRows(TEST_TYPE_LIKERT, config, JSON.stringify({ q1: 1 }));

      expect(rows[0].answer).toBe("1 — Редко или никогда");
      expect(rows[1].answer).toBe("—");
    });

    it("accepts already-parsed answers objects", () => {
      const rows = buildAnswerRows(TEST_TYPE_LIKERT, config, { q1: 3 });

      expect(rows[0].answer).toBe("3 — Часто");
    });
  });

  describe("text", () => {
    const config = JSON.stringify(TEST_CONFIG_EXAMPLES[TEST_TYPE_TEXT]);

    it("passes the answer text through", () => {
      const rows = buildAnswerRows(TEST_TYPE_TEXT, config, JSON.stringify({ expectations: "Хочу научиться" }));

      expect(rows).toEqual([
        {
          number: 1,
          question: "Какие у вас ожидания от участия в исследовании?",
          answer: "Хочу научиться",
        },
      ]);
    });
  });
});
