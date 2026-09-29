import { getProgress } from '../services/progress.service.js';

export async function progress(req, res) {
  res.json({ success: true, data: await getProgress(req.user._id) });
}
