// All API calls in one place.
import { api, unwrap } from './api';

export const resumeApi = {
  get: () => unwrap(api.get('/resume')),
  upload: (file) => {
    const form = new FormData();
    form.append('resume', file);
    return unwrap(api.post('/resume', form));
  },
  analyzeGap: (payload) => unwrap(api.post('/resume/gap', payload)),
};

export const interviewApi = {
  list: (page = 1, limit = 10) => unwrap(api.get('/interviews', { params: { page, limit } })),
  start: (payload) => unwrap(api.post('/interviews', payload)),
  get: (id) => unwrap(api.get(`/interviews/${id}`)),
  prepareCoding: (id) => unwrap(api.post(`/interviews/${id}/prepare-coding`)),
  answerText: (id, text) => unwrap(api.post(`/interviews/${id}/answer`, { text })),
  answerAudio: (id, blob) => {
    const form = new FormData();
    const extension = blob.type.includes('mp4') ? 'm4a' : 'webm';
    form.append('audio', blob, `answer.${extension}`);
    return unwrap(api.post(`/interviews/${id}/answer`, form));
  },
  submitCode: (id, payload) => unwrap(api.post(`/interviews/${id}/code`, payload)),
  finish: (id) => unwrap(api.post(`/interviews/${id}/finish`)),
  speech: (id, turnIndex, signal) =>
    api.post(`/interviews/${id}/speech`, { turnIndex }, { responseType: 'blob', signal }).then((response) => response.data),
  remove: (id) => unwrap(api.delete(`/interviews/${id}`)),
};

export const coachingApi = {
  coachTopic: (interviewId, topicId) => unwrap(api.post(`/interviews/${interviewId}/topics/${topicId}/coach`)),
  askCoach: (question, history) => unwrap(api.post('/coach/ask', { question, history })),
};

export const drillApi = {
  list: () => unwrap(api.get('/drills')),
  create: (payload = {}) => unwrap(api.post('/drills', payload)),
  get: (id) => unwrap(api.get(`/drills/${id}`)),
  answer: (id, text) => unwrap(api.post(`/drills/${id}/answer`, { text })),
};

export const progressApi = {
  get: () => unwrap(api.get('/progress')),
};
