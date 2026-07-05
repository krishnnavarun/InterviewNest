import * as interviewService from '../services/interview.service.js';

export const startInterview = async (req, res, next) => {
  try {
    const { role, resumeText, totalQuestions } = req.body;

    if (!role) {
      return res.status(400).json({ success: false, message: 'Please select a role for the interview.' });
    }
    if (!resumeText) {
      return res.status(400).json({ success: false, message: 'Please upload your resume first.' });
    }

    const result = await interviewService.startInterview(
      req.user._id,
      role,
      resumeText,
      req.user.name,
      totalQuestions || 5
    );

    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};