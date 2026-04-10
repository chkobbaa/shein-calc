const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Import API handlers
const loginHandler = require('./api/login');
const scrapeHandler = require('./api/scrape');
const settingsHandler = require('./api/settings');
const extractImagesHandler = require('./api/extract-images');

// Mount routes
app.post('/api/login', loginHandler);
app.post('/api/scrape', scrapeHandler);
app.get('/api/settings', settingsHandler);
app.post('/api/settings', settingsHandler);
app.post('/api/extract-images', extractImagesHandler);

// Serve frontend for convenience
app.use(express.static('./'));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
