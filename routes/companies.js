// Company routes

const express = require("express");
const db = require("../db");
const ExpressError = require("../expressError");
const slugify = require("slugify");

const router = new express.Router();

// GET /companies

router.get("/", async function (req, res, next) {
  try {
    const results = await db.query(`SELECT code, name FROM companies`);
    return res.json({ companies: results.rows });
  } catch (err) {
    return next(err);
  }
});

// GET /companies/:code

router.get("/:code", async function (req, res, next) {
  try {
    const { code } = req.params;
    const companyResults = await db.query(
      `SELECT code, name, description FROM companies WHERE code=$1`,
      [code]
    );
    const invoiceResults = await db.query(
      `SELECT id FROM invoices WHERE comp_code=$1`,
      [code]
    );
    if (companyResults.rows.length === 0) {
      throw new ExpressError(`No such company: ${code}`, 404);
    }
    const company = companyResults.rows[0];
    const invoices = invoiceResults.rows;
    company.invoices = invoices.map((inv) => inv.id);
    return res.json({ company: company });
  } catch (err) {
    return next(err);
  }
});

// POST /companies

router.post("/", async function (req, res, next) {
  try {
    const { name, description } = req.body;
    const slug = slugify(name, { lower: true, strict: true });
    const results = await db.query(
      `INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`,
      [slug, name, description]
    );
    return res.status(201).json({ company: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});

// PUT /companies/:code

router.put("/:code", async function (req, res, next) {
  try {
    const { code } = req.params;
    const { name, description } = req.body;
    const results = await db.query(
      `UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description`,
      [name, description, code]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(`No such company: ${code}`, 404);
    }
    return res.json({ company: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});

// DELETE /companies/:code

router.delete("/:code", async function (req, res, next) {
  try {
    const { code } = req.params;
    const results = await db.query(
      `DELETE FROM companies WHERE code=$1 RETURNING code`,
      [code]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(`No such company: ${code}`, 404);
    }
    return res.json({ status: "deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
