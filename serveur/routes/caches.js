const express = require('express');
const router = express.Router();
const cacheController = require('../controllers/cacheController');
const authMiddleware = require('../middleware/auth');

// Créer une nouvelle cache
router.post('/', authMiddleware, cacheController.createCache);

// Récupérer toutes les caches (le filtrage par proximité peut être géré dans le controller)
router.get('/', authMiddleware, cacheController.getCaches);

// Mettre à jour une cache existante
router.put('/:id', authMiddleware, cacheController.updateCache);

// Supprimer une cache
router.delete('/:id', authMiddleware, cacheController.deleteCache);

module.exports = router;
