let currentQuiz = null;

function startQuiz(text) {
  currentQuiz = {
    text,
    questions: [...text.questions],
    currentQuestion: 0,
    answers: [],
    score: 0
  };
  return currentQuiz;
}

function getQuiz() {
  return currentQuiz;
}

function answerQuestion(answerIndex) {
  if (!currentQuiz) return null;

  const q = currentQuiz.questions[currentQuiz.currentQuestion];
  const isCorrect = answerIndex === q.correct;

  currentQuiz.answers.push({
    questionIndex: currentQuiz.currentQuestion,
    selected: answerIndex,
    correct: q.correct,
    isCorrect
  });

  if (isCorrect) currentQuiz.score++;
  currentQuiz.currentQuestion++;

  return currentQuiz.answers[currentQuiz.answers.length - 1];
}

function getQuizProgress() {
  if (!currentQuiz) return null;
  return {
    current: currentQuiz.currentQuestion,
    total: currentQuiz.questions.length,
    score: currentQuiz.score
  };
}

function isQuizFinished() {
  return currentQuiz && currentQuiz.currentQuestion >= currentQuiz.questions.length;
}

function getQuizResults() {
  if (!currentQuiz) return null;
  return {
    text: currentQuiz.text,
    score: currentQuiz.score,
    total: currentQuiz.questions.length,
    answers: currentQuiz.answers,
    percentage: Math.round((currentQuiz.score / currentQuiz.questions.length) * 100)
  };
}

function clearQuiz() {
  currentQuiz = null;
}
