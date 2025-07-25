import { Contact } from '../interfaces/contact.interface';
import pool from '../config/database';
import logger from '../utils/logger';

class ContactModel {
  public async create(
    contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
  ): Promise<Contact> {
    const query = `
      INSERT INTO Contact (phoneNumber, email, linkedId, linkPrecedence, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `;
    const values = [
      contact.phoneNumber,
      contact.email,
      contact.linkedId,
      contact.linkPrecedence,
    ];

    const [result] = await pool.execute(query, values);
    const insertId = (result as any).insertId;

    return this.findById(insertId);
  }

  public async findById(id: number): Promise<Contact> {
    const query = 'SELECT * FROM Contact WHERE id = ? AND deletedAt IS NULL';
    const [rows] = await pool.execute(query, [id]);
    return (rows as Contact[])[0];
  }

  public async findByEmailOrPhone(
    email?: string,
    phoneNumber?: string
  ): Promise<Contact[]> {
    if (!email && !phoneNumber) return [];

    let query = 'SELECT * FROM Contact WHERE deletedAt IS NULL AND (';
    const conditions: string[] = [];
    const values: (string | null)[] = [];

    if (email) {
      conditions.push('email = ?');
      values.push(email);
    }

    if (phoneNumber) {
      conditions.push('phoneNumber = ?');
      values.push(phoneNumber);
    }

    query += conditions.join(' OR ') + ')';

    const [rows] = await pool.execute(query, values);
    return rows as Contact[];
  }

  public async update(id: number, updates: Partial<Contact>): Promise<Contact> {
    const setClauses: string[] = [];
    const values: (string | number | null | Date)[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        setClauses.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (setClauses.length === 0) {
      return this.findById(id);
    }

    setClauses.push('updatedAt = NOW()');
    const query = `UPDATE Contact SET ${setClauses.join(', ')} WHERE id = ?`;
    values.push(id);

    await pool.execute(query, values);
    return this.findById(id);
  }

  public async findLinkedContacts(primaryId: number): Promise<Contact[]> {
    const query =
      'SELECT * FROM Contact WHERE (id = ? OR linkedId = ?) AND deletedAt IS NULL';
    const [rows] = await pool.execute(query, [primaryId, primaryId]);
    return rows as Contact[];
  }
}

export default ContactModel;
