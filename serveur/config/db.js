//config/db.js

const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db('geocaching');
    console.log('MongoDB connecté (driver natif)');
  } catch (err) {
    console.error('Erreur MongoDB :', err.message);
    process.exit(1);
  }
}

function getDB() {
  return db;
}

module.exports = { connectDB, getDB };
