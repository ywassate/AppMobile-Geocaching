const { getDB } = require('../config/db');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');

exports.getProfile = async (req, res) => {
  const db = getDB();
  const users = db.collection('users');
  const user = await users.findOne({ _id: new ObjectId(req.user.id) }, { projection: { password: 0 } });

  if (!user) return res.status(404).json({ msg: 'Utilisateur non trouvé' });
  res.json(user);
};

exports.updateProfile = async (req, res) => {
  const db = getDB();
  const users = db.collection('users');
  const { email, password } = req.body;

  const updates = {};
  if (email) updates.email = email;
  if (password) {
    const hashed = await bcrypt.hash(password, 10);
    updates.password = hashed;
  }

  await users.updateOne({ _id: new ObjectId(req.user.id) }, { $set: updates });
  res.json({ msg: 'Profil mis à jour' });
};
