const express = require('express');          // Load Express framework to create the server
const path = require('path');                // Load path module to work with folder/file paths
const hbs = require('express-handlebars');   // Load Handlebars template engine correctly
const fs = require('fs');                    // Load file system to read the JSON file

// Get the path to the movie data file
const filePath = path.join(__dirname, 'data', 'movieData.json');

let movies = [];  // Create an empty array to hold movie data

const app = express();                       // Create an Express application
const port = process.env.PORT || 3000;       // Use environment port or default to 3000

app.use(express.urlencoded({ extended: true }));  // Allow form data to be sent (URL-encoded)

// Read and parse movie data JSON file once when server starts
fs.readFile(filePath, 'utf8', (err, data) => {
  if (!err) {
    movies = JSON.parse(data);  // Parse JSON into JavaScript array
    console.log("Movie data loaded successfully.");
  } else {
    console.error("Failed to load movie data:", err);
  }
});

// Create custom Handlebars instance with helper
const hbsInstance = hbs.create({
  extname: '.hbs',
   partialsDir: path.join(__dirname, 'views', 'partials'),  
  helpers: {
  highlightIfNoMetascore: function(score, options) {
    if (
      !score ||
      score.toString().trim() === '' ||
      score.toString().toLowerCase() === 'n/a'
    ) {
      return options.fn(this); // Run block if metascore is invalid
    } else {
      return options.inverse(this); // Run block normally
    }
  }
}
});

// Register Handlebars as the view engine using our custom instance
app.engine('.hbs', hbsInstance.engine);
app.set('view engine', 'hbs');                     // Set Handlebars as the view engine
app.set('views', path.join(__dirname, 'views'));  // Set the directory for view templates

// Serve static files like CSS and images from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// ------------------ ROUTES ------------------

// Home page
app.get('/', (req, res) => {
  res.render('index', { title: 'Express' });  // Render index.hbs with a title
});

// Route to list all movie data
app.get('/data', (req, res) => {
  res.render('data', { title: 'All Movies', movies });  // Render data.hbs with all movies
});

// Route to view a movie by index (e.g., /data/movie/0)
app.get('/data/movie/:index', (req, res) => {
  const index = parseInt(req.params.index);
  const movie = movies[index];  // Get movie at that index

  if (movie) {
    res.render('movie', { title: 'Movie Details', movie });  // Show movie details
  } else {
    res.status(404).render('error', {
      title: 'Error',
      message: `No movie found at index ${index}`
    });
  }
});

// Show search form for movie ID
app.get('/data/search/id', (req, res) => {
  res.render('searchId', { title: 'Search by Movie ID' });
});

// Handle POST form for movie ID search
app.post('/data/search/id', (req, res) => {
  const movieId = parseInt(req.body.movie_id);  // Get entered ID from form
  const movie = movies.find(m => m.Movie_ID === movieId);  // Search movie

  if (movie) {
    res.render('searchIdResult', { title: 'Search Result', movie });  // Show result
  } else {
    res.render('searchIdResult', {
      title: 'Search Result',
      notFound: true,
      id: movieId
    });
  }
});

// Show search form for movie title
app.get('/data/search/title', (req, res) => {
  res.render('searchTitle', { title: 'Search by Title' });
});
app.get('/filteredData', (req, res) => {
  res.render('filteredData', { title: 'Filtered Movies', movies });
});

// Handle POST form for title search
app.post('/data/search/title', (req, res) => {
  const searchTerm = req.body.title.toLowerCase();  // Get search term
  const filtered = movies.filter(m =>
    m.Title.toLowerCase().includes(searchTerm)  // Find matching titles
  );

  res.render('searchTitleResult', {
    title: 'Search Results',
    results: filtered,
    searchTerm
  });
});

// Route to display all movies (including only those with metascore)
app.get('/allData', (req, res) => {
  res.render('allData', { title: 'All Movies With Metascore', movies });
});

// Route for /users (just for example)
app.get('/users', (req, res) => {
  res.send('respond with a resource');
});

// Handle any other route (404 error)
app.get('*', (req, res) => {
  res.status(404).render('error', {
    title: 'Error',
    message: 'Wrong Route'
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
