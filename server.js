// --- Backend Server (server.js) ---
// Is file ko 'server.js' naam se save karein.

// 1. Zaroori libraries ko import karein
const express = require('express');
const cors = require('cors');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// 2. Firebase Credentials
// Yeh file aapko Firebase se milegi. Iska naam 'serviceAccountKey.json' hona chahiye.
// Is file ko 'server.js' ke saath same folder mein rakhein.
const serviceAccount = require('./serviceAccountKey.json');

// 3. Express App aur Firebase ko initialize karein
const app = express();
app.use(cors()); // Frontend se request allow karne ke liye
app.use(express.json()); // JSON data ko samajhne ke liye

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore(); // Firestore database se connection

// --- API Routes ---

// Route 1: Saari movies ko get karne ke liye
app.get('/movies', async (req, res) => {
    try {
        const moviesRef = db.collection('movies');
        const snapshot = await moviesRef.orderBy('createdAt', 'desc').get();
        
        if (snapshot.empty) {
            return res.status(200).json([]); // Khaali array bhejein agar koi movie nahi hai
        }

        let movies = [];
        snapshot.forEach(doc => {
            movies.push({ id: doc.id, ...doc.data() });
        });
        
        res.status(200).json(movies);
    } catch (error) {
        console.error("Error getting movies: ", error);
        res.status(500).send("Server par movies get karte samay error aayi.");
    }
});

// Route 2: Nayi movie ko database mein add karne ke liye
app.post('/movies', async (req, res) => {
    try {
        const movieData = req.body;
        
        if (!movieData.title || !movieData.category || !movieData.posterUrl) {
            return res.status(400).send("Zaroori data (title, category, posterUrl) missing hai.");
        }

        const movieToAdd = {
            ...movieData,
            createdAt: new Date().toISOString() // Movie kab bani, iska time daalein
        };
        
        const docRef = await db.collection('movies').add(movieToAdd);
        res.status(201).json({ id: docRef.id, ...movieToAdd });

    } catch (error) {
        console.error("Error adding movie: ", error);
        res.status(500).send("Server par movie add karte samay error aayi.");
    }
});

// Route 3: Movie ko delete karne ke liye
app.delete('/movies/:id', async (req, res) => {
    try {
        const movieId = req.params.id;
        await db.collection('movies').doc(movieId).delete();
        res.status(200).send(`Movie ID: ${movieId} safaltapoorvak delete ho gayi.`);
    } catch(error) {
        console.error("Error deleting movie: ", error);
        res.status(500).send("Server par movie delete karte samay error aayi.");
    }
});


// 4. Server ko start karein
const PORT = 3000; // Humara server is port par chalega
app.listen(PORT, () => {
    console.log(`Backend server http://localhost:${PORT} par chal raha hai`);
});
