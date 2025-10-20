const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Si el usuario visita cualquier ruta no definida, devuelve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/api/orders', (req, res) => {
  const { shipping_cost, total, num_products, items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'El pedido debe tener al menos un producto (items).' });
  }

  const insertOrderSql = `INSERT INTO orders (shipping_cost, total, num_products) VALUES (?, ?, ?)`;
  db.run(insertOrderSql, [shipping_cost || 0, total || 0, num_products || items.length], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    const orderId = this.lastID;

    const insertItemSql = `INSERT INTO order_items (order_id, product_name, cost_price, sale_price) VALUES (?, ?, ?, ?)`;
    const stmt = db.prepare(insertItemSql);
    for (const it of items) {
      stmt.run(orderId, it.product_name, it.cost_price || 0, it.sale_price || 0);
    }
    stmt.finalize((err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, orderId });
    });
  });
});

app.get('/api/orders', (req, res) => {
  const ordersSql = `SELECT * FROM orders ORDER BY created_at DESC`;
  db.all(ordersSql, [], (err, orders) => {
    if (err) return res.status(500).json({ error: err.message });
    const results = [];
    let pending = orders.length;
    if (pending === 0) return res.json([]);
    orders.forEach((o) => {
      db.all(`SELECT * FROM order_items WHERE order_id = ?`, [o.id], (err2, items) => {
        if (err2) return res.status(500).json({ error: err2.message });
        results.push({ ...o, items });
        pending -= 1;
        if (pending === 0) res.json(results);
      });
    });
  });
});

app.get('/api/orders/:id', (req, res) => {
  const id = req.params.id;
  db.get(`SELECT * FROM orders WHERE id = ?`, [id], (err, order) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
    db.all(`SELECT * FROM order_items WHERE order_id = ?`, [id], (err2, items) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ ...order, items });
    });
  });
});

app.delete('/api/orders/:id', (req, res) => {
  const id = req.params.id;
  db.run(`DELETE FROM orders WHERE id = ?`, [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json({ success: true });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API escuchando en http://localhost:${PORT}`));
