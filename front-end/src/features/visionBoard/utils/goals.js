// Goals used to be plain strings; they are now { text, done }. Every reader
// goes through these helpers so old boards keep rendering.

export const MAX_GOALS_PER_LIST = 20;
export const MAX_GOAL_LENGTH = 160;

export const normalizeGoal = (goal) => {
  if (goal === null || goal === undefined) return null;
  if (typeof goal === "string") {
    const text = goal.trim().slice(0, MAX_GOAL_LENGTH);
    return text ? { text, done: false } : null;
  }
  if (typeof goal === "object") {
    const text = String(goal.text ?? "").trim().slice(0, MAX_GOAL_LENGTH);
    return text ? { text, done: Boolean(goal.done) } : null;
  }
  return null;
};

export const normalizeGoals = (list) =>
  Array.isArray(list) ? list.map(normalizeGoal).filter(Boolean).slice(0, MAX_GOALS_PER_LIST) : [];

// Editing form: keep blank rows so a freshly added goal has somewhere to be
// typed. Blanks are dropped by normalizeGoals when the board is saved.
export const toEditableGoals = (list) =>
  Array.isArray(list)
    ? list
        .map((goal) =>
          typeof goal === "string"
            ? { text: goal, done: false }
            : { text: String(goal?.text ?? ""), done: Boolean(goal?.done) }
        )
        .slice(0, MAX_GOALS_PER_LIST)
    : [];

export const goalProgress = (board) => {
  const all = [...normalizeGoals(board?.shortTermGoals), ...normalizeGoals(board?.longTermGoals)];
  const done = all.filter((g) => g.done).length;
  const total = all.length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
};

export const toggleGoalAt = (list, index) =>
  normalizeGoals(list).map((g, i) => (i === index ? { ...g, done: !g.done } : g));
