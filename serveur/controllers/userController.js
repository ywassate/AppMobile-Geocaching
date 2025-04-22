const { getDB } = require('../config/db');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');
const { calculateDistance } = require('../utils/geoUtils');

// 📄 GET /api/users/profile
exports.getProfile = async (req, res) => {
  try {
    const db = getDB();
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(req.user.id) },
      { projection: { password: 0 } }
    );

    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    res.json({
      email: user.email,
      username: user.username,
      imageUrl: user.imageUrl || null,
    });
  } catch (err) {
    console.error('❌ Erreur getProfile:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ✏️ PUT /api/users/profile
exports.updateProfile = async (req, res) => {
  try {
    const db = getDB();
    const users = db.collection('users');
    const { email, password } = req.body;

    const updates = {};
    if (email) updates.email = email;
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      updates.password = hashed;
    }

    await users.updateOne(
      { _id: new ObjectId(String(req.user.id)) },
      { $set: updates }
    );

    res.json({ msg: 'Profil mis à jour' });
  } catch (err) {
    console.error('❌ Erreur updateProfile:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const db = getDB();
    const caches = db.collection('caches');
    const userId = new ObjectId(req.user.id);

    // 📌 Nombre de caches créées
    const hides = await caches.countDocuments({ creator: userId });

    // 📌 Récupération des caches trouvées avec logs
    const foundCaches = await caches.find({
      logs: {
        $elemMatch: {
          user: userId,
          found: true
        }
      }
    }).toArray();

    let totalDistance = 0;
    let finds = 0;

    for (const cache of foundCaches) {
      const userLogs = cache.logs.filter(log =>
        log.user.toString() === userId.toString() &&
        log.found === true &&
        log.location
      );

      for (const log of userLogs) {
        const [lng2, lat2] = cache.coordinates?.coordinates || [];
        const { latitude: lat1, longitude: lng1 } = log.location;

        if (lat1 && lng1 && lat2 && lng2) {
          totalDistance += calculateDistance(lat1, lng1, lat2, lng2);
          finds++;
        }
      }
    }

    res.json({
      finds,
      hides,
      distance: parseFloat(totalDistance.toFixed(2)), // en kilomètres
      score: finds + hides
    });
  } catch (err) {
    console.error('❌ Erreur getStats:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des stats' });
  }
};