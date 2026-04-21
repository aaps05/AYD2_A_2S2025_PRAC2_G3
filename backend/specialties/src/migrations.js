const pool = require('./db');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS especialidades (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(255) NOT NULL,
  descripcion TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS especialidad_servicios (
  id               SERIAL PRIMARY KEY,
  especialidad_id  INTEGER NOT NULL REFERENCES especialidades(id) ON DELETE CASCADE,
  servicio_id      INTEGER NOT NULL,
  UNIQUE(especialidad_id, servicio_id)
);
`;

const SEEDS_ESPECIALIDADES = `
INSERT INTO especialidades (nombre, descripcion) VALUES
  ('Cardiología',          'Diagnóstico y tratamiento de enfermedades del corazón y sistema cardiovascular.'),
  ('Pediatría',            'Atención médica integral para niños y adolescentes.'),
  ('Laboratorio Clínico',  'Análisis clínicos y de laboratorio para diagnóstico y seguimiento.'),
  ('Neurología',           'Diagnóstico y tratamiento de trastornos del sistema nervioso.'),
  ('Traumatología',        'Atención de lesiones del sistema musculoesquelético.');
`;

// servicio_ids corresponde al orden de los servicios en el microservicio de servicios:
const SEEDS_LINKS = `
INSERT INTO especialidad_servicios (especialidad_id, servicio_id) VALUES
  (1, 1), (1, 2), (1, 10),
  (2, 3),
  (3, 4), (3, 5), (3, 6),
  (4, 7), (4, 8),
  (5, 9)
ON CONFLICT DO NOTHING;
`;

async function connectWithRetry(retries = 12, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      client.release();
      return;
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`DB not ready (attempt ${i + 1}/${retries}), retrying in ${delay / 1000}s...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

async function initDb() {
  await connectWithRetry();
  const client = await pool.connect();
  try {
    await client.query(SCHEMA);
    const { rows } = await client.query('SELECT COUNT(*) FROM especialidades');
    if (parseInt(rows[0].count) === 0) {
      await client.query(SEEDS_ESPECIALIDADES);
      await client.query(SEEDS_LINKS);
      console.log('Seed data inserted');
    }
    console.log('Database initialized');
  } finally {
    client.release();
  }
}

module.exports = { initDb };
