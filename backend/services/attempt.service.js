// Candidate ko assessment bhejne se pehle secret cheezein hata do
export function sanitizeAssessment(assessment) {
  return {
    _id: assessment._id,
    title: assessment.title,
    durationMinutes: assessment.durationMinutes,
    difficulty: assessment.difficulty,
    questions: assessment.questions.map((q) => ({
      _id: q._id,
      type: q.type,
      title: q.title,
      text: q.text,
      skill: q.skill,
      points: q.points,
      options: q.options ? [...q.options] : undefined, // correctIndex NAHI bhejna
      constraints: q.constraints,
      // Sirf sample test cases. Hidden ke sirf count bhejte hain
      sampleTestCases: q.testCases
        ?.filter((t) => !t.isHidden)
        .map((t) => ({ input: t.input, expectedOutput: t.expectedOutput })),
      hiddenCount: q.testCases?.filter((t) => t.isHidden).length || 0,
    })),
  };
}

// Is question ka answer dhundo, na mile to naya bana do
export function getOrCreateAnswer(attempt, questionId) {
  let answer = attempt.answers.find((a) => a.questionId.toString() === questionId.toString());
  if (!answer) {
    attempt.answers.push({ questionId });
    answer = attempt.answers[attempt.answers.length - 1];
  }
  return answer;
}

// Attempt khatam: sab scores jodo. Dobara chalane pe bhi same result aata hai
export function finalizeAttempt(attempt, assessment) {
  const skills = {};
  let totalScore = 0;
  let maxScore = 0;

  for (const question of assessment.questions) {
    const answer = getOrCreateAnswer(attempt, question._id);

    // MCQ: deterministic. Coding ka score Submit ke time hi set ho chuka hai
    if (question.type === "mcq") {
      answer.score = answer.selectedIndex === question.correctIndex ? question.points : 0;
    }

    totalScore += answer.score;
    maxScore += question.points;

    const skill = question.skill || "General";
    skills[skill] = skills[skill] || { score: 0, max: 0 };
    skills[skill].score += answer.score;
    skills[skill].max += question.points;
  }

  attempt.totalScore = Math.round(totalScore * 100) / 100;
  attempt.maxScore = maxScore;
  attempt.percentage = maxScore ? Math.round((totalScore / maxScore) * 100) : 0;
  attempt.skillScores = Object.entries(skills).map(([skill, v]) => ({ skill, ...v }));
  attempt.status = "submitted";
  attempt.submittedAt = new Date();
}