const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM servicios_medicos ORDER BY nombre'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM servicios_medicos WHERE id = $1',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Servicio no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { nombre, descripcion_tecnica, requisitos_previos, precio, disponible } = req.body;
  if (!nombre || precio === undefined) {
    return res.status(400).json({ error: 'nombre y precio son requeridos' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO servicios_medicos (nombre, descripcion_tecnica, requisitos_previos, precio, disponible)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nombre, descripcion_tecnica, requisitos_previos, precio, disponible ?? true]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { nombre, descripcion_tecnica, requisitos_previos, precio, disponible } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE servicios_medicos
       SET nombre=$1, descripcion_tecnica=$2, requisitos_previos=$3, precio=$4, disponible=$5
       WHERE id=$6 RETURNING *`,
      [nombre, descripcion_tecnica, requisitos_previos, precio, disponible, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Servicio no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM servicios_medicos WHERE id=$1 RETURNING *',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Servicio no encontrado' });
    res.json({ message: 'Eliminado', servicio: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
