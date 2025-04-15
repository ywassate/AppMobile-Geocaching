#!/bin/bash

# Rediriger toutes les sorties (stdout et stderr) vers un fichier .log
LOGFILE="test_results_$(date +%Y-%m-%d_%H-%M-%S).log"
exec > >(tee -a "$LOGFILE") 2>&1

# --- Début du script original ---
#!/bin/bash

API_URL="http://localhost:3000"
EMAIL1="user1@example.com"
EMAIL2="user2@example.com"
PASSWORD="password123"

echo "🔐 Connexion ou création des utilisateurs..."
TOKEN1=$(curl -s -X POST $API_URL/api/auth/login -H "Content-Type: application/json" -d '{"email": "'$EMAIL1'", "password": "'$PASSWORD'"}' | jq -r '.token')
if [ "$TOKEN1" == "null" ]; then
  TOKEN1=$(curl -s -X POST $API_URL/api/auth/register -H "Content-Type: application/json" -d '{"email": "'$EMAIL1'", "password": "'$PASSWORD'"}' | jq -r '.token')
fi
TOKEN2=$(curl -s -X POST $API_URL/api/auth/login -H "Content-Type: application/json" -d '{"email": "'$EMAIL2'", "password": "'$PASSWORD'"}' | jq -r '.token')
if [ "$TOKEN2" == "null" ]; then
  TOKEN2=$(curl -s -X POST $API_URL/api/auth/register -H "Content-Type: application/json" -d '{"email": "'$EMAIL2'", "password": "'$PASSWORD'"}' | jq -r '.token')
fi

echo "🪪 TOKEN1 = $TOKEN1"
echo "🪪 TOKEN2 = $TOKEN2"

# Création d'une cache pour les tests de suppression
CACHE_ID=$(curl -s -X POST $API_URL/api/caches -H "Authorization: $TOKEN1" -H "Content-Type: application/json" -d '{"lat": 43.6, "lng": 1.44, "difficulty": 3, "description": "cache test"}' | jq -r '._id')
echo "🆔 CACHE_ID = $CACHE_ID"

echo "\n🔍 Test : Token expiré"
echo "⚠️ Test Token expiré : à tester manuellement (besoin d'un token généré avec expiresIn = 1s)" 

echo "\n🔍 Test : Token falsifié"
curl -s -X GET http://localhost:3000/api/caches \
  -H "Authorization: bad.token.value" | jq

echo "\n🔍 Test : Injection JSON"
curl -s -X POST http://localhost:3000/api/caches \
  -H "Authorization: $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{"lat": 43.6, "lng": 1.44, "difficulty": 3, "description": "<script>alert(1)</script>"}' | jq

echo "\n🔍 Test : Suppression par un autre utilisateur"
curl -s -X DELETE $API_URL/api/caches/$CACHE_ID \
  -H "Authorization: $TOKEN2" | jq

echo "\n🔍 Test : Accès cache introuvable"
curl -s -X GET $API_URL/api/caches/000000000000000000000000 \
  -H "Authorization: $TOKEN1" | jq

echo "\n🔍 Test : Multi-utilisateurs"
echo "👥 Vérification : user1 et user2 ont bien des tokens séparés..." 

echo "TOKEN1: $TOKEN1" 

echo "TOKEN2: $TOKEN2" 

echo "\n🔍 Test : Hash avec même mot de passe"
echo "🔒 Vérifie dans la base Mongo que les hash des users user1 et user2 sont différents (manuellement dans Compass ou via find)" 

echo "\n🔍 Test : Connexion brute force"
for i in {1..3}; do
  curl -s -X POST $API_URL/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "user1@example.com", "password": "wrongpass"}' | jq
done

echo "\n🔍 Test : Filtrage géographique"
echo "📍 À implémenter côté backend avec distance et filtre (Haversine ou $geoNear)" 

echo "\n🔍 Test : Valeurs invalides"
curl -s -X POST $API_URL/api/caches \
  -H "Authorization: $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{"lat": "invalid", "lng": "invalid", "difficulty": -5}' | jq

echo "\n🔍 Test : Payload énorme"
curl -s -X POST $API_URL/api/caches \
  -H "Authorization: $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{"lat": 43.6, "lng": 1.44, "difficulty": 2, "description": "'"$(head -c 10000 </dev/urandom | base64)"'"}' | jq

echo "\n🔍 Test : Pagination"
curl -s "$API_URL/api/caches?page=0&limit=3" \
  -H "Authorization: $TOKEN1" | jq

echo "\n🔍 Test : Suppression en masse"
for id in $(curl -s -X GET $API_URL/api/caches -H "Authorization: $TOKEN1" | jq -r '.[]._id'); do
  curl -s -X DELETE $API_URL/api/caches/$id -H "Authorization: $TOKEN1" > /dev/null
done
echo "🗑️ Toutes les caches supprimées pour user1." 

echo "\n🔍 Test : Mise à jour partielle"
NEW_CACHE=$(curl -s -X POST $API_URL/api/caches \
  -H "Authorization: $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{"lat": 43.7, "lng": 1.5, "difficulty": 2, "description": "A modifier"}' | jq -r '._id')

curl -s -X PUT $API_URL/api/caches/$NEW_CACHE \
  -H "Authorization: $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{"description": "Modifié partiellement"}' | jq


# Création d’une nouvelle cache
CACHE_ID=$(curl -s -X POST $API_URL/api/caches \
  -H "Authorization: $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{"lat": 43.6, "lng": 1.44, "difficulty": 3, "description": "cache avec commentaire"}' | jq -r '._id')

# Création d’un commentaire et récupération de son ID
COMMENT_ID=$(curl -s -X POST $API_URL/api/comments/$CACHE_ID \
  -H "Authorization: $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{"text": "Trop cool cette cache !"}' | jq -r '._id')


echo "\n🔍 Test : Voir les commentaires"
curl -X GET $API_URL/api/comments/$CACHE_ID \
  -H "Authorization: $TOKEN1" | jq

echo "\n🔍 Test : Suppression du commentaire"
curl -X DELETE $API_URL/api/comments/$COMMENT_ID \
  -H "Authorization: $TOKEN1" | jq






