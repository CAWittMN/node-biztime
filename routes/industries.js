const express = require("express");
const db = require("../db");
const ExpressError = require("../expressError");
const slugify = require("slugify");

const router = new express.Router();

// add a new industry

router.post("/", async function (req, res, next) {
  try {
    const { industry } = req.body;
    const code = slugify(industry, { lower: true, strict: true });
    const results = await db.query(
      `INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING code, industry`,
      [code, industry]
    );
    return res.status(201).json({ industry: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});

// get all industries

router.get("/", async function (req, res, next) {
  try {
    const results = await db.query(`SELECT code, industry FROM industries`);
    return res.json({ industries: results.rows });
  } catch (err) {
    return next(err);
  }
});

// associate an industry with a company

router.post("/:companyCode/:industryCode", async function (req, res, next) {
  try {
    const { companyCode, industryCode } = req.params;
    const results = await db.query(
      `INSERT INTO companies_industries (comp_code, ind_code) VALUES ($1, $2) RETURNING comp_code, ind_code`,
      [companyCode, industryCode]
    );
    return res.status(201).json({ industry: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
