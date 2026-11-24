const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// 1. Connect to MongoDB (local by default; paste an Atlas link here or set MONGO_URI)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/movies';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection failed:', err.message));

// 2. Movie model
const Movie = mongoose.model('Movie', new mongoose.Schema({
  title:  { type: String, required: true, trim: true },
  year:   Number,
  genre:  String,
  rating: { type: Number, min: 0, max: 10 },
}, { timestamps: true }));

// 3. Routes
// View all + search:  GET /api/movies?search=batman
app.get('/api/movies', async (req, res) => {
  const { search } = req.query;
  const filter = search
    ? { $or: [
        { title: { $regex: search, $options: 'i' } },
        { genre: { $regex: search, $options: 'i' } },
      ] }
    : {};
  res.json(await Movie.find(filter).sort({ createdAt: -1 }));
});

// View one
app.get('/api/movies/:id', async (req, res) => {
  const movie = await Movie.findById(req.params.id).catch(() => null);
  movie ? res.json(movie) : res.status(404).json({ error: 'Movie not found' });
});

// Add
app.post('/api/movies', async (req, res) => {
  try {
    res.status(201).json(await Movie.create(req.body));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Update
app.put('/api/movies/:id', async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    movie ? res.json(movie) : res.status(404).json({ error: 'Movie not found' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Delete
app.delete('/api/movies/:id', async (req, res) => {
  const movie = await Movie.findByIdAndDelete(req.params.id).catch(() => null);
  movie ? res.json({ message: 'Deleted' }) : res.status(404).json({ error: 'Movie not found' });
});

app.listen(3000, () => console.log('Open http://localhost:3000'));
