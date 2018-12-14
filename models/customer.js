/** Customer for Lunchly */

const db = require('../db');
const Reservation = require('./reservation');

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, middleName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.middleName = middleName || '';
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** method for getting a customer's full name */
  get fullName() {
    return `${this.firstName} ${this.middleName} ${this.lastName}`;
  }

  /** methods for getting/setting notes (keep as empty string, not NULL) */

  set notes(val) {
    this._notes = val || '';
  }

  get notes() {
    return this._notes;
  }

  /** methods for getting/setting phone #. */

  set phone(val) {
    this._phone = val || null;
  }

  get phone() {
    return this._phone;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by name. */
  static async search(name) {
    const results = await db.query(
      `SELECT id, 
      first_name AS "firstName",  
      last_name AS "lastName", 
      phone, 
      notes 
     FROM customers
     WHERE UPPER(first_name) = $1 OR UPPER(last_name) = $1`,
      [name.toUpperCase()]
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get top ten customers. */
  static async topTen() {
    const results = await db.query(
      `
      SELECT c.id, first_name AS "firstName", last_name AS "lastName", phone, c.notes, customer_id, COUNT(*) 
      FROM customers as c 
      JOIN reservations ON c.id = customer_id
      GROUP BY c.id, first_name, last_name, phone, c.notes, customer_id
      ORDER BY COUNT(*) DESC
      LIMIT 10
      `
    );
    console.log(results.rows);
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4)
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }
}

module.exports = Customer;
