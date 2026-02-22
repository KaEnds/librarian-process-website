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
                  ${sinceFilter}
                  ORDER BY br.updated_at ASC NULLS LAST, br.request_id ASC`;
    const result: QueryResult<any> = await client.query(query, values);
    client.release();
    return result.rows;
  } catch (error: any) {
    console.error('Error fetching book requests by batches:', error.message);
    throw error;
  }
}