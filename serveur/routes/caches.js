const express = require('express');
const router = express.Router();
const cacheController = require('../controllers/cacheController');
const authMiddleware = require('../middleware/auth');

// Créer une cache
router.post('/', authMiddleware, cacheController.createCache);

// Récupérer toutes les caches
router.get('/', authMiddleware, cacheController.getCaches);

// Récupérer caches proches
router.get('/nearby', authMiddleware, cacheController.getCachesNearby);

// Caches trouvées par utilisateur
router.get('/found', authMiddleware, cacheController.getCachesFoundByUser);

// Ajouter log (trouvée/non trouvée + commentaire)
router.post('/:cacheId/logs', authMiddleware, cacheController.addCacheLog);

router.get('/:cacheId/comments', authMiddleware, cacheController.getCacheComments);


// Modifier cache
router.put('/:id', authMiddleware, cacheController.updateCache);

// Caches créées par l'utilisateur connecté
router.get('/my-caches', authMiddleware, cacheController.getMyCaches);

// Supprimer cache
router.delete('/:id', authMiddleware, cacheController.deleteCache);

module.exports = router;
