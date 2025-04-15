const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

// Récupérer les informations du profil de l'utilisateur connecté
router.get('/profile', authMiddleware, userController.getProfile);

// Mettre à jour le profil de l'utilisateur connecté
router.put('/profile', authMiddleware, userController.updateProfile);

module.exports = router;
