// Zod schemas for every structured AI output. They are sent to Gemini as JSON
// Schema (constrained decoding) and used again to validate the response.
// Property order matters: Gemini generates fields in schema order, so we put
// "evaluate" fields before "decide" fields to make the model reason first.
import { z } from 'zod';
import { DIMENSION_IDS, TOPIC_KINDS, TURN_ACTIONS } from '../config/interview.constants.js';

export const ResumeProfileSchema = z.object({
  name: z.string().describe("Candidate's full name, or empty string if not present"),
  headline: z.string().describe('One-line professional summary, at most 15 words'),
  seniority: z.enum(['student', 'junior', 'mid', 'senior']),
  yearsOfExperience: z.number().min(0).max(50).describe('Total professional experience in years (internships count as fractions)'),
  skills: z
    .array(
      z.object({
        name: z.string(),
        category: z.enum(['language', 'framework', 'database', 'cloud_devops', 'tool', 'concept']),
      })
    )
    .max(40),
  projects: z
    .array(
      z.object({
        name: z.string(),
        summary: z.string().describe('One sentence'),
        techStack: z.array(z.string()).max(10),
        highlights: z.array(z.string()).max(3).describe('Concrete achievements or responsibilities'),
      })
    )
    .max(6),
  experience: z
    .array(
      z.object({
        title: z.string(),
        company: z.string(),
        duration: z.string(),
        highlights: z.array(z.string()).max(3),
      })
    )
    .max(6),
  suggestedRoleIds: z.array(z.string()).max(3).describe('Role ids from the provided list that best fit this resume'),
});

export const GapAnalysisSchema = z.object({
  matchScore: z.number().int().min(0).max(100),
  summary: z.string().describe('1-2 sentences on overall fit, addressed to the candidate as "you"'),
  matchedSkills: z.array(z.string()).max(15),
  missingSkills: z
    .array(
      z.object({
        skill: z.string(),
        importance: z.enum(['must_have', 'nice_to_have']),
      })
    )
    .max(10),
  focusAreas: z
    .array(z.object({ topic: z.string(), reason: z.string() }))
    .max(4)
    .describe('Topics the mock interview should probe'),
});

export const InterviewPlanSchema = z.object({
  greeting: z.string().describe('At most 2 sentences. No question.'),
  topics: z
    .array(
      z.object({
        title: z.string().describe('Short topic title, max 6 words'),
        kind: z.enum(TOPIC_KINDS),
        openingQuestion: z.string(),
        whyThisTopic: z.string().describe('One sentence: why this topic for this candidate'),
        rubric: z
          .array(
            z.object({
              criterion: z.string().describe('An observable quality of a good answer'),
              dimension: z.enum(DIMENSION_IDS),
              lookFor: z.string().describe('What a strong answer contains, one sentence'),
            })
          )
          .min(2)
          .max(4),
      })
    )
    .min(3)
    .max(8),
});

export const TurnSchema = z.object({
  evaluation: z.object({
    answerQuality: z.enum(['strong', 'adequate', 'weak', 'no_answer', 'off_topic']),
    criteria: z
      .array(
        z.object({
          criterion: z.string().describe('Copy the rubric criterion text exactly'),
          score: z.number().int().min(1).max(5),
          evidence: z
            .string()
            .describe('Verbatim quote (max 25 words) from the candidate that justifies the score, or empty string'),
        })
      )
      .max(4),
    summary: z.string().describe('One sentence assessment of the candidate on this topic so far, addressed as "you"'),
    manipulationAttempt: z.boolean(),
  }),
  decision: z.object({
    action: z.enum(TURN_ACTIONS),
    reasoning: z
      .string()
      .describe('One sentence explaining why you chose this action, written to the candidate as "you" (they read it in their report)'),
  }),
  reply: z.object({
    acknowledgment: z.string().describe('One short natural sentence reacting to what the candidate actually said'),
    question: z.string().describe('The next question to ask, or empty string for wrap_up'),
  }),
});

export const CodingProblemSchema = z.object({
  title: z.string(),
  statement: z.string().describe('Plain-text problem statement with input/output format and constraints'),
  functionName: z.string().describe('camelCase function name'),
  params: z
    .array(z.object({ name: z.string().describe('camelCase'), type: z.string().describe('e.g. number[], string, number') }))
    .min(1)
    .max(4),
  returnType: z.string(),
  examples: z
    .array(
      z.object({
        args: z.string().describe('JSON array of the arguments, e.g. [[2,7,11,15], 9]'),
        expected: z.string().describe('JSON of the expected return value'),
        explanation: z.string(),
      })
    )
    .min(2)
    .max(3),
  tests: z
    .array(
      z.object({
        args: z.string().describe('JSON array of the arguments'),
        expected: z.string().describe('JSON of the expected return value'),
      })
    )
    .min(6)
    .max(10),
  referenceSolution: z.string().describe('Correct JavaScript function declaration named functionName. No imports, no console.'),
  optimalComplexity: z.string().describe('e.g. "O(n) time, O(n) space"'),
});

export const CodeReviewSchema = z.object({
  correctness: z.number().int().min(1).max(5),
  efficiency: z.number().int().min(1).max(5),
  codeQuality: z.number().int().min(1).max(5),
  timeComplexity: z.string(),
  spaceComplexity: z.string(),
  summary: z.string().describe('2 sentences, addressed to the candidate as "you"'),
  issues: z.array(z.string()).max(4),
  acknowledgment: z.string().describe('One natural sentence the interviewer says after reading the code'),
  followUpQuestion: z.string().describe('One spoken question about this solution'),
});

export const ReportNarrativeSchema = z.object({
  headline: z.string().describe('One-sentence verdict'),
  summary: z.string().describe('3-4 sentences, addressed as "you"'),
  strengths: z.array(z.object({ point: z.string(), evidence: z.string() })).max(4),
  improvements: z
    .array(z.object({ point: z.string(), evidence: z.string(), howToImprove: z.string() }))
    .max(4),
  studyPlan: z
    .array(z.object({ topic: z.string(), why: z.string(), practice: z.string() }))
    .min(2)
    .max(5),
  communicationTips: z.array(z.string()).max(3),
});

// ---------------------------------------------------------------------------
// Answer coach (report): grounded rewrite of the candidate's own answer
// ---------------------------------------------------------------------------
export const AnswerCoachSchema = z.object({
  verdict: z.string().describe('One sentence on how the answer landed, addressed as "you"'),
  missedPoints: z
    .array(z.object({ point: z.string(), why: z.string().describe('Why an interviewer cares, one sentence') }))
    .max(4),
  improvedAnswer: z
    .string()
    .describe('The candidate answer rewritten to be stronger, in first person, 80-170 words. Only facts the candidate stated or that are in their profile; unknown details become [placeholders].'),
  strongAnswerOutline: z.array(z.string()).min(3).max(6).describe('What a strong answer to this question covers'),
  practiceTip: z.string().describe('One concrete thing to practise'),
});

// ---------------------------------------------------------------------------
// Practice drills: one targeted question, graded instantly
// ---------------------------------------------------------------------------
export const DrillQuestionSchema = z.object({
  topicTitle: z.string().describe('Short topic title, max 6 words'),
  kind: z.enum(['behavioral', 'technical', 'project_deep_dive', 'system_design']),
  question: z.string().describe('One interview question, 1-2 sentences'),
  whyThisDrill: z.string().describe('One sentence: why this drill helps the candidate'),
  rubric: z
    .array(
      z.object({
        criterion: z.string(),
        dimension: z.enum(DIMENSION_IDS),
        lookFor: z.string(),
      })
    )
    .min(2)
    .max(4),
});

export const DrillFeedbackSchema = z.object({
  evaluation: z.object({
    answerQuality: z.enum(['strong', 'adequate', 'weak', 'no_answer', 'off_topic']),
    criteria: z
      .array(
        z.object({
          criterion: z.string().describe('Copy the rubric criterion text exactly'),
          score: z.number().int().min(1).max(5),
          evidence: z.string().describe('Verbatim quote (max 25 words) from the answer, or empty string'),
        })
      )
      .max(4),
    summary: z.string(),
    manipulationAttempt: z.boolean(),
  }),
  strengths: z.array(z.string()).max(3),
  improvements: z.array(z.string()).max(3),
  strongAnswerOutline: z.array(z.string()).min(3).max(6),
});

// ---------------------------------------------------------------------------
// Career coach (RAG over the candidate's interview history)
// ---------------------------------------------------------------------------
export const CoachAnswerSchema = z.object({
  answer: z
    .string()
    .describe('Helpful, specific answer in plain text (short paragraphs or "- " bullets). Cite sources inline as [1], [2].'),
  citations: z.array(z.number().int().min(1).max(20)).max(8).describe('Source numbers actually used'),
  followUps: z.array(z.string()).max(3).describe('Short follow-up questions the candidate might ask next'),
});
