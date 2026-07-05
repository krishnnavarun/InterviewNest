import API from './api.js';

const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append('resume', file);

  const response = await API.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
};

const getResume = async () => {
  const response = await API.get('/resume');
  return response.data.data;
};

const startInterview = async (role, resumeText, totalQuestions) => {
  const response = await API.post('/interview/start', { role, resumeText, totalQuestions });
  return response.data.data;
};

export { uploadResume, getResume, startInterview };