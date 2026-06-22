import { parseTestConfig, TEST_TYPE_LIKERT } from "./testTypes";

function resolveScale(question, config) {
  return {
    min: question.min ?? config.scale?.min ?? 1,
    max: question.max ?? config.scale?.max ?? 5,
    labels: question.labels ?? config.scale?.labels,
    min_label: question.min_label ?? config.scale?.min_label,
    max_label: question.max_label ?? config.scale?.max_label,
  };
}

function formatLikertAnswer(value, question, config) {
  if (value == null || value === "") {
    return "—";
  }

  const numericValue = Number(value);
  const scale = resolveScale(question, config);
  const { labels, min, max, min_label, max_label } = scale;

  if (labels) {
    const text = Array.isArray(labels)
      ? labels[numericValue - min]
      : labels[numericValue] ?? labels[String(numericValue)];
    if (text) {
      return `${numericValue} — ${text}`;
    }
  }

  if (numericValue === min && min_label) {
    return `${numericValue} — ${min_label}`;
  }
  if (numericValue === max && max_label) {
    return `${numericValue} — ${max_label}`;
  }

  return String(numericValue);
}

function formatAnswer(slug, question, config, value) {
  if (value == null || value === "") {
    return "—";
  }

  if (slug === TEST_TYPE_LIKERT) {
    return formatLikertAnswer(value, question, config);
  }

  return String(value);
}

export function buildAnswerRows(slug, config, answers) {
  const parsedConfig = parseTestConfig(config);
  const parsedAnswers = typeof answers === "string" ? JSON.parse(answers) : answers ?? {};

  return (parsedConfig.questions ?? []).map((question, index) => ({
    number: index + 1,
    question: question.text,
    answer: formatAnswer(slug, question, parsedConfig, parsedAnswers[question.id]),
  }));
}
