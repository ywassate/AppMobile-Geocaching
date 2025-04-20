// routes/users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload'); // 👈 Ajouté ici

// Récupérer les informations du profil
router.get('/profile', authMiddleware, userController.getProfile);

// Mettre à jour le profil avec image
router.put('/profile', authMiddleware, upload.single('avatar'), userController.updateProfile);

router.get('/stats', authMiddleware, userController.getStats);

module.exports = router;
