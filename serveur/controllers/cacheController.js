const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

exports.createCache = async (req, res) => {
  const db = getDB();
  const caches = db.collection('caches');

  const { lat, lng, difficulty, description } = req.body;
  const newCache = {
    coordinates: { lat, lng },
    difficulty,
    description,
    creator: new ObjectId(req.user.id)
  };

  const result = await caches.insertOne(newCache);
  res.status(201).json({ ...newCache, _id: result.insertedId });
};

exports.getCaches = async (req, res) => {
  const db = getDB();
  const caches = db.collection('caches');

  const allCaches = await caches.find().toArray();
  res.json(allCaches);
};

exports.updateCache = async (req, res) => {
  const db = getDB();
  const caches = db.collection('caches');

  const { id } = req.params;
  const { lat, lng, difficulty, description } = req.body;

  const cache = await caches.findOne({ _id: new ObjectId(id) });
  if (!cache) return res.status(404).json({ msg: 'Cache non trouvée' });

  if (cache.creator.toString() !== req.user.id) {
    return res.status(403).json({ msg: 'Non autorisé' });
  }

  const updateFields = {};
  if (lat !== undefined) updateFields['coordinates.lat'] = lat;
  if (lng !== undefined) updateFields['coordinates.lng'] = lng;
  if (difficulty !== undefined) updateFields.difficulty = difficulty;
  if (description !== undefined) updateFields.description = description;

  await caches.updateOne({ _id: new ObjectId(id) }, { $set: updateFields });
  const updated = await caches.findOne({ _id: new ObjectId(id) });
  res.json(updated);
};

exports.deleteCache = async (req, res) => {
  const db = getDB();
  const caches = db.collection('caches');
  const { id } = req.params;

  const cache = await caches.findOne({ _id: new ObjectId(id) });
  if (!cache) return res.status(404).json({ msg: 'Cache non trouvée' });

  if (cache.creator.toString() !== req.user.id) {
    return res.status(403).json({ msg: 'Non autorisé' });
  }

  await caches.deleteOne({ _id: new ObjectId(id) });
  res.json({ msg: 'Cache supprimée' });
};
