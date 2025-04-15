const { getDB } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { secret, expiresIn } = require('../config/jwt');
const { ObjectId } = require('mongodb');

exports.register = async (req, res) => {
  const db = getDB();
  const users = db.collection('users');

  const { email, password } = req.body;
  const existing = await users.findOne({ email });

  if (existing) return res.status(400).json({ msg: 'Email déjà utilisé' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await users.insertOne({ email, password: hashedPassword });

  const payload = { id: result.insertedId };
  const token = jwt.sign(payload, secret, { expiresIn });
  res.json({ token });
};

exports.login = async (req, res) => {
  const db = getDB();
  const users = db.collection('users');

  const { email, password } = req.body;
  const user = await users.findOne({ email });
  if (!user) return res.status(400).json({ msg: 'Utilisateur non trouvé' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ msg: 'Mot de passe incorrect' });

  const payload = { id: user._id };
  const token = jwt.sign(payload, secret, { expiresIn });
  res.json({ token });
};
