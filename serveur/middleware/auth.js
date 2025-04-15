const jwt = require('jsonwebtoken');
const { secret } = require('../config/jwt');

module.exports = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ msg: 'Token manquant' });

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // contient l'id de l'utilisateur
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token invalide' });
  }
};
