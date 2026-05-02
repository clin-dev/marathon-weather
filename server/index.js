require('dotenv').config();
const express = require('express');
const path    = require('path');
const { init } = require('./db');
const racesRouter   = require('./routes/races');
const marathonsRouter = require('./routes/marathons');
const weatherRouter = require('./routes/weather');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/races', racesRouter);
app.use('/api/marathons', marathonsRouter);
app.use('/api',       weatherRouter);

const PORT = process.env.PORT || 3000;

init()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running → http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  });
