const pool = require('./db');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS servicios_medicos (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(255) NOT NULL,
  descripcion_tecnica TEXT,
  requisitos_previos  TEXT,
  precio      NUMERIC(10,2) NOT NULL,
  disponible  BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
`;

const SEEDS = `
INSERT INTO servicios_medicos (nombre, descripcion_tecnica, requisitos_previos, precio, disponible) VALUES
  ('Electrocardiograma (ECG)',      'Registro gráfico de la actividad eléctrica del corazón mediante electrodos.', 'Ninguno', 150.00, true),
  ('Ecocardiograma',                'Ultrasonido del corazón para evaluar estructura y función cardíaca.',           'Ayuno de 4 horas', 800.00, true),
  ('Consulta Pediátrica',           'Evaluación médica general para pacientes menores de 18 años.',                 'Ninguno', 200.00, true),
  ('Hemograma Completo',            'Análisis de sangre que evalúa los componentes sanguíneos (glóbulos, plaquetas).', 'Ayuno de 8 horas', 80.00, true),
  ('Glucosa en Ayunas',             'Medición de niveles de azúcar en sangre en condiciones de ayuno.',             'Ayuno de 8 horas', 45.00, true),
  ('Colesterol Total',              'Determinación de colesterol total y fracciones en sangre.',                    'Ayuno de 12 horas', 65.00, true),
  ('Resonancia Magnética Cerebral', 'Imagen detallada del cerebro usando campos magnéticos y ondas de radio.',     'No portar objetos metálicos', 1500.00, true),
  ('Tomografía Computarizada',      'Serie de imágenes de rayos X para evaluar estructuras internas del cuerpo.',  'Ninguno', 1200.00, true),
  ('Radiografía de Tórax',          'Imagen de rayos X del pecho para evaluar pulmones, corazón y costillas.',     'Ninguno', 200.00, true),
  ('Prueba de Esfuerzo',            'Evaluación de la respuesta cardíaca durante actividad física controlada.',    'No fumar 3 horas antes, ropa cómoda', 600.00, true);
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
    const { rows } = await client.query('SELECT COUNT(*) FROM servicios_medicos');
    if (parseInt(rows[0].count) === 0) {
      await client.query(SEEDS);
      console.log('Seed data inserted');
    }
    console.log('Database initialized');
  } finally {
    client.release();
  }
}

module.exports = { initDb };
