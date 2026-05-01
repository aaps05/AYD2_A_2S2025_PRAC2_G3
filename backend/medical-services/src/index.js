const express = require('express');
const cors = require('cors');
const { initDb } = require('./migrations');
const serviciosRouter = require('./routes/servicios');
const { login } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post('/api/admin/login', login);
app.use('/api/servicios', serviciosRouter);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'medical-services' }));

async function start() {
  await initDb();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Medical Services running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Startup error:', err);
  process.exit(1);
});
