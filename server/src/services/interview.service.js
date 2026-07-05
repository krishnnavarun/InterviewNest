import Interview from '../models/Interview.model.js';
import { askGemini } from './gemini.service.js';
import { generateAudio } from './murf.service.js';
import { parseGeminiJSON } from '../utils/prompts.utils.js';
import {
  GENERATE_QUESTIONS_PROMPT,
  INTERVIEW_GREETING_PROMPT,
  FOLLOW_UP_PROMPT,
  FEEDBACK_PROMPT,
  EVALUATE_CODE_PROMPT,
  buildConversationHistory,
} from '../constants/prompts.js';

export const startInterview = async (userId, role, resumeText, candidateName, totalQuestions = 5) => {
  const questionsPrompt = GENERATE_QUESTIONS_PROMPT(role, resumeText, totalQuestions);
  const questionsResponse = await askGemini(questionsPrompt);
  const aiQuestions = parseGeminiJSON(questionsResponse);

  const introQuestion = {
    text: 'Tell me about yourself — your background, what you\'re currently working on, and what excites you about this role.',
    type: 'behavioral',
    isCodeQuestion: false,
  };
  const questions = [introQuestion, ...aiQuestions];

  const interview = await Interview.create({
    userId,
    role,
    resumeText,
    totalQuestions: questions.length,
    currentQuestion: 1,
    questions,
    status: 'in_progress',
  });

  const greetingPrompt = INTERVIEW_GREETING_PROMPT(role, candidateName);
  const greeting = await askGemini(greetingPrompt);

  interview.messages.push({
    role: 'interviewer',
    content: greeting,
    timestamp: new Date(),
  });

  let audioBase64 = null;
  try {
    audioBase64 = await generateAudio(greeting);
  } catch (audioError) {
    console.error('Audio generation failed, continuing without audio:', audioError.message);
  }

  interview.lastAudio = audioBase64 || '';
  await interview.save();

  return {
    interviewId: interview._id,
    greeting: greeting,
    currentQuestion: 1,
    totalQuestions: questions.length,
    question: introQuestion,
    audio: audioBase64,
  };
};