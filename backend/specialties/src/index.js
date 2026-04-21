const express = require('express');
const cors = require('cors');
const { initDb } = require('./migrations');
const especialidadesRouter = require('./routes/especialidades');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.use('/api/especialidades', especialidadesRouter);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'specialties' }));

async function start() {
  await initDb();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Specialties Service running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Startup error:', err);
  process.exit(1);
});
