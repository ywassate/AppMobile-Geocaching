//Controllers/authController.js

const { getDB } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { secret, expiresIn } = require('../config/jwt');
const { ObjectId } = require('mongodb');

exports.register = async (req, res) => {
  const db = getDB();
  const users = db.collection('users');

  const { username, email, password, confirmPassword } = req.body;

  if (!username || !email || !password || !confirmPassword) {
    return res.status(400).json({ msg: 'Tous les champs sont requis' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ msg: 'Les mots de passe ne correspondent pas' });
  }

  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{12,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ msg: 'Le mot de passe doit contenir au moins 12 caractères, des chiffres et des symboles' });
  }

  const existing = await users.findOne({ email });
  if (existing) return res.status(400).json({ msg: 'Email déjà utilisé' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await users.insertOne({ username, email, password: hashedPassword });

  const payload = { id: result.insertedId, username };
  const token = jwt.sign(payload, secret, { expiresIn });
  res.json({ token });
};

exports.login = async (req, res) => {
  const db = getDB();
  const users = db.collection('users');

  const { identifier, password } = req.body;

  const user = await users.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  });

  if (!user) return res.status(400).json({ msg: 'Utilisateur non trouvé' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ msg: 'Mot de passe incorrect' });

  const payload = { id: user._id, username: user.username };
  const token = jwt.sign(payload, secret, { expiresIn });
  res.json({ token });
};
