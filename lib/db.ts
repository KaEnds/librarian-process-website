import { Pool, QueryResult } from 'pg';
import { hash } from 'bcryptjs';
import { compare } from 'bcryptjs';

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
    console.log('Database connection successful!');
    console.log('Current database time:', result.rows[0].now);
    client.release();
    return true;
  } catch (error: any) {
    console.error('Database connection failed:', error.message);
    return false;
  }

};

export type RegisterWebUserInput = {
  username: string;
  password: string;
  userRole: string;
  accountStatus: string;
  name: string;
  surname: string;
};

export type RegisterWebUserRecord = {
  user_id: number;
  username: string;
  user_role: string;
  account_status: string;
  name: string;
  surname: string;
};

type LoginWebUserRow = RegisterWebUserRecord & {
  password: string;
};

export const registerWebUser = async ({
  username,
  password,
  userRole,
  accountStatus,
  name,
  surname,
}: RegisterWebUserInput): Promise<RegisterWebUserRecord> => {
  const normalizedUsername = username.trim();

  let client;
  try {
    client = await pool.connect();

    const existingUserQuery = `
      SELECT user_id
      FROM librairy.web_user
      WHERE LOWER(TRIM(username)) = LOWER($1)
      LIMIT 1
    `;

    const existingUserResult: QueryResult<{ user_id: number }> = await client.query(existingUserQuery, [normalizedUsername]);

    if (existingUserResult.rows.length > 0) {
      const duplicateError = new Error('username นี้ถูกใช้งานแล้ว') as Error & { code?: string };
      duplicateError.code = 'USERNAME_EXISTS';
      throw duplicateError;
    }

    const passwordHash = await hash(password, 12);

    const query = `
      INSERT INTO librairy.web_user (username, password, user_role, account_status, name, surname)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING user_id, username, user_role, account_status, name, surname
    `;

    const values = [normalizedUsername, passwordHash, userRole, accountStatus, name, surname];
    const result: QueryResult<RegisterWebUserRecord> = await client.query(query, values);
    return result.rows[0];
  } catch (error: unknown) {
    console.error('Error registering web user:', error);
    throw error;
  } finally {
    client?.release();
  }
}

export const loginWebUser = async (username: string, password: string): Promise<RegisterWebUserRecord | null> => {
  const normalizedUsername = username.trim();

  let client;
  try {
    client = await pool.connect();

    const query = `
      SELECT user_id, TRIM(username) AS username, RTRIM(password) AS password, user_role, account_status, name, surname
      FROM librairy.web_user
      WHERE LOWER(TRIM(username)) = LOWER($1)
      LIMIT 1
    `;

    const result: QueryResult<LoginWebUserRow> = await client.query(query, [normalizedUsername]);

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    const storedPassword = user.password?.trimEnd() ?? '';
    const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(storedPassword);
    const isPasswordValid = isBcryptHash
      ? await compare(password, storedPassword)
      : password === storedPassword;

    if (!isPasswordValid) {
      return null;
    }

    if (!isBcryptHash) {
      const passwordHash = await hash(password, 12);
      await client.query(
        `
          UPDATE librairy.web_user
          SET password = $1
          WHERE user_id = $2
        `,
        [passwordHash, user.user_id]
      );
    }

    return {
      user_id: user.user_id,
      username: user.username,
      user_role: user.user_role,
      account_status: user.account_status,
      name: user.name,
      surname: user.surname,
    };
  } catch (error: unknown) {
    console.error('Error logging in web user:', error);
    throw error;
  } finally {
    client?.release();
  }
}

export const getWebUserById = async (userId: number): Promise<RegisterWebUserRecord | null> => {
  let client;
  try {
    client = await pool.connect();

    const query = `
      SELECT user_id, TRIM(username) AS username, user_role, account_status, name, surname
      FROM librairy.web_user
      WHERE user_id = $1
      LIMIT 1
    `;

    const result: QueryResult<RegisterWebUserRecord> = await client.query(query, [userId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error: unknown) {
    console.error('Error fetching web user by id:', error);
    throw error;
  } finally {
    client?.release();
  }
}

export const getAllWebUsers = async (): Promise<RegisterWebUserRecord[]> => {
  let client;
  try {
    client = await pool.connect();

    const query = `
      SELECT user_id, TRIM(username) AS username, user_role, account_status, name, surname
      FROM librairy.web_user
      ORDER BY user_id ASC
    `;

    const result: QueryResult<RegisterWebUserRecord> = await client.query(query);
    return result.rows;
  } catch (error: unknown) {
    console.error('Error fetching all web users:', error);
    throw error;
  } finally {
    client?.release();
  }
}

export const getBookRequestsByBatches = async (since?: string): Promise<any[]> => {
  try {
    const client = await pool.connect();
    const values: any[] = [];

    const batchActiveFilter = "(CURRENT_TIMESTAMP - INTERVAL '7 days') BETWEEN b.batch_start_date AND b.batch_end_date";
    
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
              br.request_id AS request_id,
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

    const result = await client.query(query, values);
    client.release();
    return result.rows;
  } catch (error: any) {
    console.error('Error fetching book requests by batches (7 days ago logic):', error.message);
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
              br.request_id AS request_id,
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

export const updateBookRequestReviewStatus = async (requestId: number, reviewStatus: "PENDING_REVIEW" | "REJECT_REVIEW" | "APPROVE_REVIEW"): Promise<boolean> => {
  try {
    const client = await pool.connect();

    const query = `
      UPDATE librairy.book_requests 
      SET review_status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE request_id = $2
      RETURNING request_id
    `;
    const values = [reviewStatus, requestId];

    const result: QueryResult<any> = await client.query(query, values);
    client.release();

    if (result.rows.length === 0) {
      console.warn(`Book request with ID ${requestId} not found`);
      return false;
    }

    console.log(`Book request ${requestId} review_status updated to ${reviewStatus}`);
    return true;
  } catch (error: any) {
    console.error('Error updating book request review_status:', error.message);
    throw error;
  }
}

export const updateProcessStatus = async (processId: number, status: string): Promise<boolean> => {
  try {
    const client = await pool.connect();

    const query = `
      UPDATE librairy.process_state 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE process_id = $2
      RETURNING process_id
    `;
    const values = [status, processId];

    const result: QueryResult<any> = await client.query(query, values);
    client.release();

    if (result.rows.length === 0) {
      console.warn(`Process with ID ${processId} not found`);
      return false;
    }

    console.log(`Process ${processId} status updated to ${status}`);
    return true;
  } catch (error: any) {
    console.error('Error updating process status:', error.message);
    throw error;
  }
}

export const getProcessStatus = async (processId: number): Promise<string | null> => {
  try {
    const client = await pool.connect();

    const query = `
      SELECT status
      FROM librairy.process_state 
      WHERE process_id = $1
    `;
    const values = [processId];

    const result: QueryResult<any> = await client.query(query, values);
    client.release();

    if (result.rows.length === 0) {
      console.warn(`Process with ID ${processId} not found`);
      return null;
    }

    return result.rows[0].status;
  } catch (error: any) {
    console.error('Error getting process status:', error.message);
    throw error;
  }
}

export const getAllProcessStates = async (): Promise<any[]> => {
  try {
    const client = await pool.connect();

    const query = `
      SELECT process_id, status, updated_at
      FROM librairy.process_state 
      ORDER BY process_id ASC
    `;

    const result: QueryResult<any> = await client.query(query);
    client.release();

    return result.rows;
  } catch (error: any) {
    console.error('Error getting all process states:', error.message);
    throw error;
  }
}

export const getAllVendorQuotes = async (): Promise<any[]> => {
  try {
    const client = await pool.connect();

    const query = `
      SELECT DISTINCT ON (vq.quote_id)
          vq.*,
          pe.net_score, 
          pe.passed_selection,
          ad.*,
          b.batch_id,
          b.status AS batch_status,
          b.batch_start_date,
          b.batch_end_date,
          pa.*
      FROM librairy.vendor_quotes vq
      LEFT JOIN librairy.policy_evaluations pe 
          ON vq.evaluation_id = pe.evaluation_id
      LEFT JOIN librairy.acquisition_decisions ad 
          ON pe.evaluation_id = ad.evaluation_id
      LEFT JOIN librairy.batches b 
          ON pe.batch_id = b.batch_id
      LEFT JOIN librairy.purchase_approvals pa 
          ON ad.approval_id = pa.approval_id 
      WHERE (CURRENT_TIMESTAMP - INTERVAL '7 days') BETWEEN b.batch_start_date AND b.batch_end_date
      ORDER BY vq.quote_id;
    `;

    const result: QueryResult<any> = await client.query(query);
    client.release();

    return result.rows;
  } catch (error: any) {
    console.error('Error fetching all vendor quotes:', error.message);
    throw error;
  }
}

export type ReviewStatus = 'PENDING_REVIEW' | 'APPROVE_REVIEW' | 'REJECT_REVIEW';

export const updateVendorQuoteReviewStatus = async (
  quoteId: number,
  reviewStatus: ReviewStatus
): Promise<any> => {
  try {
    const client = await pool.connect();

    const query = `
      UPDATE librairy.vendor_quotes
      SET review_status = $1
      WHERE quote_id = $2
      RETURNING *
    `;

    const result: QueryResult<any> = await client.query(query, [reviewStatus, quoteId]);
    client.release();

    if (result.rows.length === 0) {
      throw new Error(`Quote with ID ${quoteId} not found`);
    }

    return result.rows[0];
  } catch (error: any) {
    console.error('Error updating vendor quote review status:', error.message);
    throw error;
  }
}

export const updateMultipleVendorQuoteReviewStatus = async (
  quoteIds: number[],
  reviewStatus: ReviewStatus
): Promise<any[]> => {
  try {
    const client = await pool.connect();

    const query = `
      UPDATE librairy.vendor_quotes
      SET review_status = $1
      WHERE quote_id = ANY($2)
      RETURNING *
    `;

    const result: QueryResult<any> = await client.query(query, [reviewStatus, quoteIds]);
    client.release();

    return result.rows;
  } catch (error: any) {
    console.error('Error updating multiple vendor quote review statuses:', error.message);
    throw error;
  }
}

export type PurchaseDecision = 'APPROVE' | 'REJECT' | 'WAIT_FOR_APPROVAL'

export const updatePurchaseDecisionByApprovedQuotes = async (
  decision: PurchaseDecision,
): Promise<number> => {
  let client;
  try {
    client = await pool.connect();

    // Update purchase_decision using 3-table relation:
    // vendor_quotes -> acquisition_decisions -> purchase_approvals
    // Also joins policy_evaluations and batches to filter by batch_id
    const query = `
      UPDATE librairy.purchase_approvals
      SET purchase_decision = $1,
          decided_at = CURRENT_TIMESTAMP
      WHERE approval_id IN (
        SELECT DISTINCT ad.approval_id
        FROM librairy.vendor_quotes vq
        JOIN librairy.acquisition_decisions ad
          ON ad.evaluation_id = vq.evaluation_id
        JOIN librairy.purchase_approvals pa
          ON pa.approval_id = ad.approval_id
        JOIN librairy.policy_evaluations pe
          ON vq.evaluation_id = pe.evaluation_id
        JOIN librairy.batches b
          ON pe.batch_id = b.batch_id
        WHERE vq.review_status = 'APPROVE_REVIEW'
          AND (CURRENT_TIMESTAMP - INTERVAL '7 days') BETWEEN b.batch_start_date AND b.batch_end_date
      )
      RETURNING approval_id
    `;

    const result: QueryResult<any> = await client.query(query, [decision]);
    console.log(`Updated purchase_decision to ${decision} for ${result.rowCount} approval(s)`);
    return result.rowCount ?? 0;
  } catch (error: any) {
    console.error('Error updating purchase decision:', error.message);
    throw error;
  } finally {
    client?.release();
  }
}

export const updateVendorQuoteNetPriceByEvaluationAndVendor = async (
  evaluationId: number,
  vendorName: string,
  netPrice: number,
): Promise<any[]> => {
  try {
    const client = await pool.connect();

    const query = `
      UPDATE librairy.vendor_quotes
      SET net_price = $1
      WHERE evaluation_id = $2 AND vendor_name = $3
      RETURNING *
    `;

    const result: QueryResult<any> = await client.query(query, [netPrice, evaluationId, vendorName]);
    client.release();

    if (result.rows.length === 0) {
      throw new Error(`Vendor quote not found for evaluation_id ${evaluationId} and vendor_name ${vendorName}`);
    }

    return result.rows;
  } catch (error: any) {
    console.error('Error updating vendor quote net_price:', error.message);
    throw error;
  }
}

export const getPolicies = async (): Promise<any[]> => {
  try {
    const client = await pool.connect();

    const query = `
      SELECT policy_id, policy_code, description, prompt_instruction, is_active
      FROM librairy.policies
      ORDER BY policy_id ASC
    `;

    const result: QueryResult<any> = await client.query(query);
    client.release();

    return result.rows;
  } catch (error: any) {
    console.error('Error fetching policies:', error.message);
    throw error;
  }
}

export const createPolicy = async (
  policyCode: string,
  description: string,
  promptInstruction: string,
  isActive: boolean = true
): Promise<any> => {
  try {
    const client = await pool.connect();

    const query = `
      INSERT INTO librairy.policies (policy_code, description, prompt_instruction, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING policy_id, policy_code, description, prompt_instruction, is_active, created_at, updated_at
    `;
    const values = [policyCode, description, promptInstruction, isActive];

    const result: QueryResult<any> = await client.query(query, values);
    client.release();

    console.log('Policy created successfully!');
    return result.rows[0];
  } catch (error: any) {
    console.error('Error creating policy:', error.message);
    throw error;
  }
}

export const updatePolicy = async (
  policyId: number,
  policyCode: string,
  description: string,
  promptInstruction: string,
  isActive: boolean
): Promise<any> => {
  try {
    const client = await pool.connect();

    const query = `
      UPDATE librairy.policies
      SET policy_code = $1, description = $2, prompt_instruction = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP
      WHERE policy_id = $5
      RETURNING policy_id, policy_code, description, prompt_instruction, is_active, created_at, updated_at
    `;
    const values = [policyCode, description, promptInstruction, isActive, policyId];

    const result: QueryResult<any> = await client.query(query, values);
    client.release();

    if (result.rows.length === 0) {
      throw new Error(`Policy with ID ${policyId} not found`);
    }

    console.log(`Policy ${policyId} updated successfully!`);
    return result.rows[0];
  } catch (error: any) {
    console.error('Error updating policy:', error.message);
    throw error;
  }
}

export const deletePolicy = async (policyId: number): Promise<void> => {
  try {
    const client = await pool.connect();

    const query = `DELETE FROM librairy.policies WHERE policy_id = $1`;

    const result: QueryResult<any> = await client.query(query, [policyId]);
    client.release();

    if (result.rowCount === 0) {
      throw new Error(`Policy with ID ${policyId} not found`);
    }

    console.log(`Policy ${policyId} deleted successfully!`);
  } catch (error: any) {
    console.error('Error deleting policy:', error.message);
    throw error;
  }
}

export type WorkflowNotificationRecord = {
  id: number
  source: string | null
  workflow_name: string | null
  execution_id: string | null
  status: string
  message: string | null
  details: unknown
  created_at: string
}

const ensureWorkflowNotificationsTable = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS librairy.workflow_notifications (
        id BIGSERIAL PRIMARY KEY,
        source TEXT NULL,
        workflow_name TEXT NULL,
        execution_id TEXT NULL,
        status TEXT NOT NULL,
        message TEXT NULL,
        details JSONB NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } finally {
    client.release();
  }
}

export const createWorkflowNotification = async (
  input: {
    source?: string | null
    workflowName?: string | null
    executionId?: string | null
    status: string
    message?: string | null
    details?: unknown
  }
): Promise<WorkflowNotificationRecord> => {
  await ensureWorkflowNotificationsTable();

  const client = await pool.connect();
  try {
    const query = `
      INSERT INTO librairy.workflow_notifications (
        source,
        workflow_name,
        execution_id,
        status,
        message,
        details
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      RETURNING id, source, workflow_name, execution_id, status, message, details, created_at
    `;

    const values = [
      input.source ?? null,
      input.workflowName ?? null,
      input.executionId ?? null,
      input.status,
      input.message ?? null,
      JSON.stringify(input.details ?? null),
    ];

    const result: QueryResult<WorkflowNotificationRecord> = await client.query(query, values);
    return result.rows[0];
  } catch (error: any) {
    console.error('Error creating workflow notification:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

export const getRecentWorkflowCompletionNotifications = async (
  limit: number = 100
): Promise<WorkflowNotificationRecord[]> => {
  await ensureWorkflowNotificationsTable();

  const client = await pool.connect();
  try {
    const query = `
      SELECT id, source, workflow_name, execution_id, status, message, details, created_at
      FROM librairy.workflow_notifications
      WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
      ORDER BY created_at DESC
      LIMIT $1
    `;

    const result: QueryResult<WorkflowNotificationRecord> = await client.query(query, [limit]);
    return result.rows;
  } catch (error: any) {
    console.error('Error fetching workflow notifications:', error.message);
    throw error;
  } finally {
    client.release();
  }
}