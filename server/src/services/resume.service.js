import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import Resume from '../models/Resume.js';
import { generateJSON } from '../ai/gemini.js';
import { ResumeProfileSchema } from '../ai/schemas.js';
import { resumeProfilePrompt } from '../ai/prompts.js';
import { ROLE_IDS } from '../config/interview.constants.js';
import { AppError } from '../lib/AppError.js';

const MIN_TEXT_LENGTH = 200;

export async function extractPdfText(buffer) {
  let pdf;
  try {
    pdf = await pdfjs.getDocument({
      data: new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength),
      isEvalSupported: false,
      useSystemFonts: true,
    }).promise;
  } catch (error) {
    throw new AppError(422, 'This file could not be opened as a PDF.', { cause: error });
  }

  const pages = [];
  for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, 6); pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => `${item.str}${item.hasEOL ? '\n' : ' '}`).join(''));
  }

  const text = pages.join('\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  if (text.length < MIN_TEXT_LENGTH) {
    // No silent fallback: a scanned/image-only PDF has no extractable text.
    throw new AppError(
      422,
      "We couldn't read enough text from this PDF. If it's a scanned image, export a text-based PDF and try again."
    );
  }
  return text;
}

export async function analyzeResume(userId, file) {
  const text = await extractPdfText(file.buffer);
  const { data: profile } = await generateJSON({
    feature: 'resume_profile',
    ...resumeProfilePrompt(text),
    schema: ResumeProfileSchema,
    temperature: 0.1,
    thinking: 'off',
    context: { userId },
  });
  profile.suggestedRoleIds = profile.suggestedRoleIds.filter((id) => ROLE_IDS.includes(id));

  const resume = await Resume.findOneAndUpdate(
    { userId },
    { userId, fileName: file.originalname, text, profile, lastGap: null },
    { upsert: true, returnDocument: 'after' }
  );
  return toResumeView(resume);
}

export async function getResume(userId) {
  const resume = await Resume.findOne({ userId });
  return resume?.profile ? toResumeView(resume) : null;
}

export async function requireResume(userId) {
  const resume = await Resume.findOne({ userId });
  if (!resume?.profile) throw new AppError(400, 'Please upload your resume first.');
  return resume;
}

function toResumeView(resume) {
  return {
    fileName: resume.fileName,
    updatedAt: resume.updatedAt,
    profile: resume.profile,
    characters: resume.text.length,
  };
}

/** Technical terms from the profile, used as speech-to-text custom vocabulary. */
export function vocabularyFromProfile(profile) {
  if (!profile) return [];
  return [
    ...profile.skills.map((skill) => skill.name),
    ...profile.projects.flatMap((project) => [project.name, ...project.techStack]),
    ...profile.experience.map((job) => job.company),
  ].filter(Boolean);
}
