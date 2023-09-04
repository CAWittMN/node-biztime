const express = require("express");
const db = require("../db");
const ExpressError = require("../expressError");

const router = new express.Router();

// GET /invoices

router.get("/", async function (req, res, next) {
  try {
    const results = await db.query(`SELECT id, comp_code FROM invoices`);
    return res.json({ invoices: results.rows });
  } catch (err) {
    return next(err);
  }
});

// GET /invoices/:id

router.get("/:id", async function (req, res, next) {
  try {
    const { id } = req.params;
    const results = await db.query(
      "SELECT i.id, i.amt, i.paid, i.add_date, i.paid_date, c.code, c.name, c.description FROM invoices AS i INNER JOIN companies AS c ON (i.comp_code = c.code) WHERE id = $1",
      [id]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(`No such invoice: ${id}`, 404);
    }
    const data = results.rows[0];
    const invoice = {
      id: data.id,
      amt: data.amt,
      paid: data.paid,
      add_date: data.add_date,
      paid_date: data.paid_date,
      company: {
        code: data.code,
        name: data.name,
        description: data.description,
      },
    };
    return res.json({ invoice: invoice });
  } catch (err) {
    return next(err);
  }
});

// POST /invoices

router.post("/", async function (req, res, next) {
  try {
    const { comp_code, amt } = req.body;
    const results = await db.query(
      `INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt]
    );
    return res.status(201).json({ invoice: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});

// PUT /invoices/:id

router.put("/:id", async function (req, res, next) {
  try {
    const { id } = req.params;
    const { amt } = req.body;
    const invoiceResult = await db.query(
      `SELECT id, comp_code, amt, paid, add_date, paid_date FROM invoices WHERE id=$1`,
      [id]
    );
    if (invoiceResult.rows.length === 0) {
      throw new ExpressError(`No such invoice: ${id}`, 404);
    }
    const invoice = invoiceResult.rows[0];
    if (!invoice.paid && amt) {
      invoice.paid = true;
      invoice.paid_date = new Date();
    } else if (invoice.paid && !amt) {
      invoice.paid = false;
      invoice.paid_date = null;
    }
    const results = await db.query(
      `UPDATE invoices SET amt=$1, paid=$2, paid_date=$3 WHERE id=$4 RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [amt, invoice.paid, invoice.paid_date, id]
    );

    return res.json({ invoice: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});

// DELETE /invoices/:id

router.delete("/:id", async function (req, res, next) {
  try {
    const { id } = req.params;
    const results = await db.query(
      `DELETE FROM invoices WHERE id=$1 RETURNING id`,
      [id]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(`No such invoice: ${id}`, 404);
    }
    return res.json({ status: "deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
