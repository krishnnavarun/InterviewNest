import multer from 'multer';
import { AppError } from '../lib/AppError.js';

const memory = multer.memoryStorage();

export const uploadResume = multer({
  storage: memory,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) =>
    file.mimetype === 'application/pdf' ? cb(null, true) : cb(new AppError(400, 'Please upload your resume as a PDF.')),
}).single('resume');

// Optional audio: the answer endpoint accepts either JSON text or multipart audio.
export const uploadAnswerAudio = multer({
  storage: memory,
  limits: { fileSize: 15 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith('audio/') || file.mimetype === 'video/webm'
      ? cb(null, true)
      : cb(new AppError(400, 'Only audio recordings are accepted.')),
}).single('audio');
