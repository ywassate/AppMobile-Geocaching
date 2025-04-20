const express = require('express');
const { connectDB } = require('./config/db');
const app = express();
const path = require('path');


app.use(express.json());

// Connexion à la base
connectDB().then(() => {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/caches', require('./routes/caches'));
  app.use('/api/users', require('./routes/users'));
  app.use('/api/comments', require('./routes/comments'));
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Serveur sur http://localhost:${PORT}`));
});
