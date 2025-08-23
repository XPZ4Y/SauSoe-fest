const express = require('express');
const path = require('path');

const app = express();

// IMPORTANT: Heroku, Render, and other services use the PORT environment variable.
// If it's not set, we default to 3000 for local development.
const PORT = process.env.PORT || 3000;

// This middleware serves the static files from the 'public' directory.
app.use(express.static(path.join(__dirname, 'public')));

// A simple API endpoint to show the server is dynamic
app.get('/api', (req, res) => {
    res.json({ message: 'Hello from the server!' });
});

// Start the server and listen for connections on the specified port.
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});