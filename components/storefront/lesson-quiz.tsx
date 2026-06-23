"use client";

import { useMemo, useState } from "react";

type LessonQuizQuestion = {
  id: string;
  question: string;
  options: unknown;
  correct_option_index: number;
  order_index: number;
};

function getOptions(value: unknown) {
  return Array.isArray(value)
    ? value.map((option) => String(option)).slice(0, 4)
    : [];
}

export function LessonQuiz({ questions }: { questions: LessonQuizQuestion[] }) {
  const sortedQuestions = useMemo(
    () => [...questions].sort((a, b) => a.order_index - b.order_index),
    [questions],
  );
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const score = sortedQuestions.reduce(
    (total, question) =>
      answers[question.id] === question.correct_option_index
        ? total + 1
        : total,
    0,
  );

  if (sortedQuestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {sortedQuestions.map((question, questionIndex) => {
        const options = getOptions(question.options);

        return (
          <fieldset
            key={question.id}
            className="space-y-3 rounded-xl bg-white/55 p-4"
          >
            <legend className="text-sm font-black">
              {questionIndex + 1}. {question.question}
            </legend>
            <div className="grid gap-2">
              {options.map((option, optionIndex) => {
                const isSelected = answers[question.id] === optionIndex;
                const isCorrect =
                  isSubmitted && question.correct_option_index === optionIndex;
                const isWrong =
                  isSubmitted &&
                  isSelected &&
                  question.correct_option_index !== optionIndex;

                return (
                  <label
                    key={`${question.id}-${optionIndex}`}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition ${
                      isCorrect
                        ? "border-primary-300 bg-primary-50 text-primary-800"
                        : isWrong
                          ? "border-red-200 bg-red-50 text-red-700"
                          : "border-border/70 bg-background/70"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`quiz-${question.id}`}
                      checked={isSelected}
                      disabled={isSubmitted}
                      onChange={() =>
                        setAnswers((current) => ({
                          ...current,
                          [question.id]: optionIndex,
                        }))
                      }
                      className="accent-primary-600 h-4 w-4"
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setIsSubmitted(true)}
          disabled={Object.keys(answers).length < sortedQuestions.length}
          className="btn-primary disabled:opacity-45"
        >
          تصحيح الكويز
        </button>
        {isSubmitted ? (
          <p className="text-primary-700 text-sm font-black">
            نتيجتك {score.toLocaleString("ar-EG")} من{" "}
            {sortedQuestions.length.toLocaleString("ar-EG")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
