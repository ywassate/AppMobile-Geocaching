const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const auth = require('../middleware/auth');

// 🔘 Ajouter un commentaire à une cache (body: { comment: "..." })
router.post('/:cacheId', auth, commentController.addComment);

// 🔘 Récupérer tous les commentaires d'une cache
router.get('/:cacheId', auth, commentController.getComments);

// 🔘 Supprimer un commentaire (seulement si tu es l'auteur)
router.delete('/:id', auth, commentController.deleteComment);

module.exports = router;
