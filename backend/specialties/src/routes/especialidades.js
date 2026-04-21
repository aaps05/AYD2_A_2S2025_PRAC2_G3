const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { rows: especialidades } = await pool.query(
      'SELECT * FROM especialidades ORDER BY nombre'
    );
    const { rows: links } = await pool.query(
      'SELECT especialidad_id, servicio_id FROM especialidad_servicios ORDER BY especialidad_id'
    );

    const result = especialidades.map((esp) => ({
      ...esp,
      servicios: links
        .filter((l) => l.especialidad_id === esp.id)
        .map((l) => l.servicio_id),
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM especialidades WHERE id = $1',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Especialidad no encontrada' });

    const { rows: links } = await pool.query(
      'SELECT servicio_id FROM especialidad_servicios WHERE especialidad_id = $1',
      [req.params.id]
    );
    res.json({ ...rows[0], servicios: links.map((l) => l.servicio_id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { nombre, descripcion, servicios = [] } = req.body;
  if (!nombre) return res.status(400).json({ error: 'nombre es requerido' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'INSERT INTO especialidades (nombre, descripcion) VALUES ($1, $2) RETURNING *',
      [nombre, descripcion]
    );
    const esp = rows[0];
    for (const sid of servicios) {
      await client.query(
        'INSERT INTO especialidad_servicios (especialidad_id, servicio_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [esp.id, sid]
      );
    }
    await client.query('COMMIT');
    res.status(201).json({ ...esp, servicios });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.put('/:id', async (req, res) => {
  const { nombre, descripcion, servicios } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'UPDATE especialidades SET nombre=$1, descripcion=$2 WHERE id=$3 RETURNING *',
      [nombre, descripcion, req.params.id]
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Especialidad no encontrada' });
    }
    if (Array.isArray(servicios)) {
      await client.query('DELETE FROM especialidad_servicios WHERE especialidad_id=$1', [req.params.id]);
      for (const sid of servicios) {
        await client.query(
          'INSERT INTO especialidad_servicios (especialidad_id, servicio_id) VALUES ($1, $2)',
          [req.params.id, sid]
        );
      }
    }
    await client.query('COMMIT');
    res.json({ ...rows[0], servicios: servicios ?? [] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM especialidades WHERE id=$1 RETURNING *',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Especialidad no encontrada' });
    res.json({ message: 'Eliminada', especialidad: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
