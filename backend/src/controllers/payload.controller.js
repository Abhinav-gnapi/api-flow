const Payload = require('../models/Payload.model');

// GET /api/payloads?configId=xxx
exports.getByConfig = async (req, res, next) => {
  try {
    const { configId } = req.query;
    if (!configId) return res.status(400).json({ error: 'configId is required' });
    const payloads = await Payload.find({ configId }).sort({ createdAt: 1 });
    res.json(payloads);
  } catch (err) {
    next(err);
  }
};

// POST /api/payloads
exports.create = async (req, res, next) => {
  try {
    const { configId, name, body, isAiGenerated, edgeCaseType } = req.body;
    if (!configId || !name) return res.status(400).json({ error: 'configId and name are required' });
    const normalizedEdgeCaseType = Payload.normalizeEdgeCaseType(
      edgeCaseType,
      isAiGenerated ? 'valid' : 'manual'
    );
    const payload = await Payload.create({
      configId,
      name,
      body,
      isAiGenerated,
      edgeCaseType: normalizedEdgeCaseType,
    });
    res.status(201).json(payload);
  } catch (err) {
    next(err);
  }
};

// POST /api/payloads/bulk  — save multiple at once (AI generated)
exports.bulkCreate = async (req, res, next) => {
  try {
    const { payloads } = req.body;
    if (!Array.isArray(payloads)) return res.status(400).json({ error: 'payloads must be an array' });
    const normalizedPayloads = payloads.map((payload) => ({
      ...payload,
      edgeCaseType: Payload.normalizeEdgeCaseType(
        payload.edgeCaseType,
        payload.isAiGenerated ? 'valid' : 'manual'
      ),
    }));
    const saved = await Payload.insertMany(normalizedPayloads);
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
};

// PUT /api/payloads/:id
exports.update = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    if (Object.prototype.hasOwnProperty.call(updateData, 'edgeCaseType')) {
      updateData.edgeCaseType = Payload.normalizeEdgeCaseType(updateData.edgeCaseType, 'manual');
    }

    const payload = await Payload.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!payload) return res.status(404).json({ error: 'Payload not found' });
    res.json(payload);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/payloads/:id
exports.remove = async (req, res, next) => {
  try {
    await Payload.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/payloads/config/:configId  — delete all payloads for a config
exports.removeByConfig = async (req, res, next) => {
  try {
    await Payload.deleteMany({ configId: req.params.configId });
    res.json({ message: 'All payloads deleted' });
  } catch (err) {
    next(err);
  }
};
