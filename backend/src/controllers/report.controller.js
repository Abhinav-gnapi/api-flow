const Report = require('../models/Report.model');

// GET /api/reports?configId=xxx
exports.getByConfig = async (req, res, next) => {
  try {
    const { configId } = req.query;
    const query = configId ? { configId } : {};
    const reports = await Report.find(query).sort({ runAt: -1 }).limit(50);
    res.json(reports);
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/:id
exports.getOne = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json(report);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/reports/:id
exports.remove = async (req, res, next) => {
  try {
    await Report.findByIdAndDelete(req.params.id);
    res.json({ message: 'Report deleted' });
  } catch (err) {
    next(err);
  }
};
