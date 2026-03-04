import { Pool, QueryResult } from 'pg';

const pool = new Pool({
  host: 'host.docker.internal',
  port: 5434,
  database: 'librairy', 
  user: 'admin',
  password: 'adminpass'
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connection successful!');
    console.log('Current database time:', result.rows[0].now);
    client.release();
    return true;
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }

};

export const getBookRequestsByBatches = async (since?: string): Promise<any[]> => {
  try {
    const client = await pool.connect();
    const values: string[] = [];
    
    const batchActiveFilter = "CURRENT_TIMESTAMP BETWEEN b.batch_start_date AND b.batch_end_date";
    const sinceFilter = since
      ? ` WHERE br.updated_at IS NOT NULL AND br.updated_at >= $1::timestamptz AND ${batchActiveFilter}`
      : ` WHERE ${batchActiveFilter}`;

    if (since) {
      values.push(since);
    }

    const query = `SELECT 
                      br.*, 
                      br.requested_at AS book_request_requested_at,
                      br.updated_at AS book_request_updated_at,
                      pe.*, 
                      b.batch_start_date, 
                      b.batch_end_date,
                      f.faculty_name_th,
                      d.department_name_th
                  FROM librairy.book_requests br
                  JOIN librairy.batch_requests b_req ON br.request_id = b_req.request_id
                  JOIN librairy.batches b ON b_req.batch_id = b.batch_id
                  LEFT JOIN librairy.policy_evaluations pe ON br.request_id = pe.request_id AND b.batch_id = pe.batch_id
                  LEFT JOIN librairy.departments d ON br.department_id = d.department_id
                  LEFT JOIN librairy.faculties f ON d.faculty_id = f.faculty_id
                  ${ sinceFilter }
                  ORDER BY br.updated_at ASC NULLS LAST, br.request_id ASC`;

    const result: QueryResult<any> = await client.query(query, values);
    client.release();
    return result.rows;
  } catch (error: any) {
    console.error('Error fetching book requests by batches:', error.message);
    throw error;
  }
}

export const getAllBookRequests = async (since?: string): Promise<any[]> => {
  try {
    const values: string[] = [];
    const sinceFilter = since
      ? " WHERE br.updated_at IS NOT NULL AND br.updated_at >= $1::timestamptz"
      : "";

    if (since) {
      values.push(since);
    }

    const query = `SELECT 
                      br.*, 
                      br.requested_at AS book_request_requested_at,
                      br.updated_at AS book_request_updated_at,
                      pe.*, 
                      b.batch_start_date, 
                      b.batch_end_date,
                      f.faculty_name_th,
                      d.department_name_th
                  FROM librairy.book_requests br
                  JOIN librairy.batch_requests b_req ON br.request_id = b_req.request_id
                  JOIN librairy.batches b ON b_req.batch_id = b.batch_id
                  LEFT JOIN librairy.policy_evaluations pe ON br.request_id = pe.request_id AND b.batch_id = pe.batch_id
                  LEFT JOIN librairy.departments d ON br.department_id = d.department_id
                  LEFT JOIN librairy.faculties f ON d.faculty_id = f.faculty_id
                  ${ sinceFilter }
                  ORDER BY br.updated_at ASC NULLS LAST, br.request_id ASC`;

    const client = await pool.connect();
    const result: QueryResult<any> = await client.query(query, values);
    client.release();
    return result.rows;
  } catch (error: any) {
    console.error('Error fetching all book requests:', error.message);
    throw error;
  }
}

export const getAllVendor = async (): Promise<any[]> => {
  try {    
    
    const client = await pool.connect();

    const query = `SELECT * FROM librairy.vendors`;

    const result: QueryResult<any> = await client.query(query);
    client.release();
    return result.rows;
  } catch (error: any) {
    console.error('Error fetching all vendors:', error.message);
    throw error;
  }
}

export const insertVendor = async (
  vendorName: string, 
  contactPerson: string, 
  vendorEmail: string, 
  telephoneNumber: string, 
  lineId: string, 
  isActive: boolean = true
): Promise<number> => {
  try {
    const client = await pool.connect();

    const query = `
      INSERT INTO librairy.vendors (vendor_name, contact_person, vendor_email, telephone_number, line_id, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING vendor_id
    `;
    const values = [vendorName, contactPerson, vendorEmail, telephoneNumber, lineId, isActive];

    const result: QueryResult<any> = await client.query(query, values);
    client.release();
    console.log('Vendor inserted successfully!');
    return result.rows[0].vendor_id;
  } catch (error: any) {
    console.error('Error inserting vendor:', error.message);
    throw error;
  }
}

export const deleteVendor = async (vendorId: number): Promise<void> => {
  try {
    const client = await pool.connect();

    const query = `DELETE FROM librairy.vendors WHERE vendor_id = $1`;
    const values = [vendorId];

    await client.query(query, values);
    client.release();
    console.log('Vendor deleted successfully!');
  } catch (error: any) {
    console.error('Error deleting vendor:', error.message);
    throw error;
  }
}