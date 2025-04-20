//controllers/commentController.js

const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

exports.addComment = async (req, res) => {
  const db = getDB();
  const comments = db.collection('comments');

  const newComment = {
    cache: new ObjectId(String(req.params.cacheId)),
    user: new ObjectId(String(req.user.id)),
    text: req.body.text,
    createdAt: new Date()
  };

  await comments.insertOne(newComment);
  res.status(201).json(newComment);
};

exports.getComments = async (req, res) => {
  const db = getDB();
  const comments = db.collection('comments');

  const result = await comments
    .find({ cache: new ObjectId(String(eq.params.cacheId)) })
    .sort({ createdAt: -1 })
    .toArray();

  res.json(result);
};

exports.deleteComment = async (req, res) => {
  const db = getDB();
  const comments = db.collection('comments');

  const comment = await comments.findOne({ _id: new ObjectId(String(req.params.id)) });
  if (!comment) return res.status(404).json({ msg: 'Commentaire non trouvé' });

  if (comment.user.toString() !== req.user.id) {
    return res.status(403).json({ msg: 'Non autorisé' });
  }

  await comments.deleteOne({ _id: new ObjectId(String(req.params.id)) });
  res.json({ msg: 'Commentaire supprimé' });
};
