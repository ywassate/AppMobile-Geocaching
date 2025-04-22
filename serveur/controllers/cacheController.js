// controllers/cacheController.js

const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

// Créer une nouvelle cache
exports.createCache = async (req, res) => {
  const db = getDB();
  const caches = db.collection('caches');

  const { lat, lng, difficulty, description } = req.body;

  const newCache = {
    coordinates: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
    difficulty,
    description,
    creator: new ObjectId(String(req.user.id)),
    logs: []
  };

  const result = await caches.insertOne(newCache);
  res.status(201).json({ ...newCache, _id: result.insertedId });
};


exports.getCaches = async (req, res) => {
  const db = getDB();
  try {
    const caches = await db.collection('caches').aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'creator',
          foreignField: '_id',
          as: 'creator'
        }
      },
      { $unwind: '$creator' },
      {
        $project: {
          description: 1,
          difficulty: 1,
          coordinates: 1,
          logs: 1,
          creator: {
            email: '$creator.email',
            username: '$creator.username',
            _id: '$creator._id'
          }
        }
      }
    ]).toArray();

    res.json(caches);
  } catch (err) {
    console.error('Erreur récupération caches avec créateurs :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};


// Récupérer les caches à proximité
exports.getCachesNearby = async (req, res) => {
  const db = getDB();
  const caches = db.collection('caches');
  const { lat, lon, radius = 10 } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ msg: 'Coordonnées lat et lon requises' });
  }

  const nearbyCaches = await caches.find({
    coordinates: {
      $near: {
        $geometry: { type: "Point", coordinates: [parseFloat(lon), parseFloat(lat)] },
        $maxDistance: parseFloat(radius) * 1000
      }
    }
  }).toArray();

  res.json(nearbyCaches);
};

// Récupérer les caches trouvées par l'utilisateur connecté
exports.getCachesFoundByUser = async (req, res) => {
  const db = getDB();
  try {
    // Utilisez une agrégation pour enrichir les données et garder le même format que getCaches
    const foundCaches = await db.collection('caches').aggregate([
      // Filtrer d'abord les caches que l'utilisateur a trouvées
      {
        $match: {
          logs: { 
            $elemMatch: { 
              user: new ObjectId(String(req.user.id)), 
              found: true 
            } 
          }
        }
      },
      // Joindre les informations du créateur
      {
        $lookup: {
          from: 'users',
          localField: 'creator',
          foreignField: '_id',
          as: 'creator'
        }
      },
      { $unwind: '$creator' },
      // Ajouter un champ found à true pour l'affichage fronted
      { $addFields: { found: true } },
      // Projeter les mêmes champs que getCaches
      {
        $project: {
          description: 1,
          difficulty: 1,
          coordinates: 1,
          logs: 1,
          found: 1,
          creator: {
            email: '$creator.email',
            username: '$creator.username',
            _id: '$creator._id'
          }
        }
      }
    ]).toArray();

    console.log(`Found ${foundCaches.length} caches for user ${req.user.id}`);
    res.json(foundCaches);
  } catch (err) {
    console.error('Erreur récupération caches trouvées :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};



exports.addCacheLog = async (req, res) => {
  const db = getDB();
  const caches = db.collection('caches');

  const { cacheId } = req.params;
  const { found, comment, location } = req.body;

  console.log("🟡 Requête reçue pour addCacheLog");
  console.log("📦 Params.cacheId  =", cacheId);
  console.log("📦 Body.found      =", found);
  console.log("📦 Body.comment    =", comment);
  console.log("📦 Body.location   =", location);
  console.log("👤 Utilisateur     =", req.user.id);

  if (!ObjectId.isValid(cacheId)) {
    return res.status(400).json({ msg: 'cacheId invalide' });
  }

  if (typeof found !== 'boolean') {
    return res.status(400).json({ msg: '`found` doit être un booléen' });
  }

  const logEntry = {
    user: new ObjectId(String(req.user.id)),
    found,
    comment,
    date: new Date(),
  };

  // Si trouvé, on ajoute la localisation (optionnelle pour commentaire simple)
  if (found && location) {
    logEntry.location = location;
  }

  await caches.updateOne(
    { _id: new ObjectId(cacheId) },
    { $push: { logs: logEntry } }
  );

  res.status(201).json({ msg: "Log ajouté avec succès" });
};



// Mettre à jour une cache existante
exports.updateCache = async (req, res) => {
  const db = getDB();
  const caches = db.collection('caches');

  const { id } = req.params;
  const { lat, lng, difficulty, description } = req.body;

  const cache = await caches.findOne({ _id: new ObjectId(String(id)) });
  if (!cache) return res.status(404).json({ msg: 'Cache non trouvée' });

  if (cache.creator.toString() !== req.user.id) {
    return res.status(403).json({ msg: 'Non autorisé' });
  }

  const updates = {};
  if (lat !== undefined && lng !== undefined) {
    updates.coordinates = { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] };
  }
  if (difficulty !== undefined) updates.difficulty = difficulty;
  if (description !== undefined) updates.description = description;

  await caches.updateOne({ _id: new ObjectId(String(id)) }, { $set: updates });

  const updatedCache = await caches.findOne({ _id: new ObjectId(String(id)) });
  res.json(updatedCache);
};





// Récupérer les caches créées par l'utilisateur connecté
exports.getMyCaches = async (req, res) => {
  const db = getDB();
  try {
    const myCaches = await db.collection('caches').aggregate([
      // Filtrer d'abord les caches créées par l'utilisateur
      {
        $match: {
          creator: new ObjectId(String(req.user.id))
        }
      },
      // Joindre les informations du créateur
      {
        $lookup: {
          from: 'users',
          localField: 'creator',
          foreignField: '_id',
          as: 'creator'
        }
      },
      { $unwind: '$creator' },
      // Projeter les mêmes champs que getCaches
      {
        $project: {
          description: 1,
          difficulty: 1,
          coordinates: 1,
          logs: 1,
          creator: {
            email: '$creator.email',
            username: '$creator.username',
            _id: '$creator._id'
          }
        }
      }
    ]).toArray();

    console.log(`Found ${myCaches.length} caches created by user ${req.user.id}`);
    res.json(myCaches);
  } catch (err) {
    console.error('Erreur récupération mes caches :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};




// Supprimer une cache
exports.deleteCache = async (req, res) => {
  const db = getDB();
  const caches = db.collection('caches');

  const { id } = req.params;

  const cache = await caches.findOne({ _id: new ObjectId(String(id)) });
  if (!cache) return res.status(404).json({ msg: 'Cache non trouvée' });

  if (cache.creator.toString() !== req.user.id) {
    return res.status(403).json({ msg: 'Non autorisé' });
  }

  await caches.deleteOne({ _id: new ObjectId(String(id)) });
  res.json({ msg: 'Cache supprimée avec succès' });
};

// Récupérer uniquement les logs.commentaire pour une cache
exports.getCacheComments = async (req, res) => {
  const db = getDB();
  const caches = db.collection('caches');
  const { cacheId } = req.params;

  try {
    const cache = await caches.findOne({ _id: new ObjectId(cacheId) });
    if (!cache) return res.status(404).json({ message: "Cache non trouvée" });

    const logs = cache.logs || [];

    const commentLogs = logs.filter(log =>
      log.found === false && log.comment && log.comment.trim() !== ''
    ).map(log => ({
      _id: log._id || new ObjectId(), // si pas d’_id dans log
      user: log.user,
      comment: log.comment,
      createdAt: log.date,
    }));

    // Peupler les utilisateurs (optionnel)
    const users = await db.collection('users').find({
      _id: { $in: commentLogs.map(log => log.user) }
    }).toArray();

    const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]));

    const enriched = commentLogs.map(log => ({
      ...log,
      user: userMap[log.user.toString()] || {},
    }));

    res.json(enriched);
  } catch (err) {
    console.error("❌ Erreur getCacheComments:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
