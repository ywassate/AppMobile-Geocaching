const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const auth = require('../middleware/auth');

// Ajouter un commentaire à une cache
router.post('/:cacheId', auth, commentController.addComment);

// Voir les commentaires d'une cache
router.get('/:cacheId', auth, commentController.getComments);

// Supprimer un commentaire
router.delete('/:id', auth, commentController.deleteComment);

module.exports = router;
