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

export const getBookRequestsByBatches = async (): Promise<any[]> => {
  try {
    const client = await pool.connect();
    const query = `SELECT 
                      br.*, 
                      pe.*, 
                      b.batch_start_date, 
                      b.batch_end_date
                  FROM librairy.book_requests br
                  JOIN librairy.batch_requests b_req ON br.request_id = b_req.request_id
                  JOIN librairy.batches b ON b_req.batch_id = b.batch_id
                  LEFT JOIN librairy.policy_evaluations pe ON br.request_id = pe.request_id AND b.batch_id = pe.batch_id
                  WHERE CURRENT_TIMESTAMP BETWEEN b.batch_start_date AND b.batch_end_date`;
    const result: QueryResult<any> = await client.query(query);
    client.release();
    return result.rows;
  } catch (error: any) {
    console.error('Error fetching book requests by batches:', error.message);
    throw error;
  }
}