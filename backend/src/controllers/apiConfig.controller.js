const ApiConfig = require('../models/ApiConfig.model');
const Payload = require('../models/Payload.model');

// GET /api/configs
exports.getAll = async (req, res, next) => {
  try {
    const configs = await ApiConfig.find().sort({ updatedAt: -1 });
    res.json(configs);
  } catch (err) {
    next(err);
  }
};

// GET /api/configs/:id
exports.getOne = async (req, res, next) => {
  try {
    const config = await ApiConfig.findById(req.params.id);
    if (!config) return res.status(404).json({ error: 'Config not found' });
    res.json(config);
  } catch (err) {
    next(err);
  }
};

// POST /api/configs
exports.create = async (req, res, next) => {
  try {
    const { name, method, url, headers, queryParams } = req.body;
    if (!name || !url) return res.status(400).json({ error: 'name and url are required' });

    const config = await ApiConfig.create({ name, method, url, headers, queryParams });
    res.status(201).json(config);
  } catch (err) {
    next(err);
  }
};

// PUT /api/configs/:id
exports.update = async (req, res, next) => {
  try {
    const config = await ApiConfig.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!config) return res.status(404).json({ error: 'Config not found' });
    res.json(config);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/configs/:id
exports.remove = async (req, res, next) => {
  try {
    await ApiConfig.findByIdAndDelete(req.params.id);
    // Cascade delete payloads
    await Payload.deleteMany({ configId: req.params.id });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    next(err);
  }
};
