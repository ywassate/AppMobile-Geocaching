//middleware/auth.js


const jwt = require('jsonwebtoken');
const { secret } = require('../config/jwt');

module.exports = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.split(' ')[1]; // ✅ supprime "Bearer"

  if (!token) {
    return res.status(401).json({ msg: 'Token manquant ou mal formé' });
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // contient l'id de l'utilisateur
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token invalide' });
  }
};
