export type CreateUserPayload = {
    username: string;
    password: string;
    confirmPassword: string;
    userRole: string;
    accountStatus: string;
    name: string;
    surname: string;
};

type CreateUserResponse = {
    message?: string;
    error?: string;
    user?: {
        user_id: number;
        username: string;
        user_role: string;
        account_status: string;
        name: string;
        surname: string;
    };
};

export const createUser = async (payload: CreateUserPayload): Promise<CreateUserResponse> => {
    const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    const data = (await res.json()) as CreateUserResponse;

    if (!res.ok) {
        throw new Error(data?.message || data?.error || 'Registration failed');
    }

    return data;
};

type LoginUserResponse = {
    message?: string;
    error?: string;
    user?: {
        user_id: number;
        username: string;
        user_role: string;
        account_status: string;
        name: string;
        surname: string;
    };
};

export const loginUser = async (username: string, password: string): Promise<LoginUserResponse> => {
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    const data = (await res.json()) as LoginUserResponse;

    if (!res.ok) {
        throw new Error(data?.message || data?.error || 'Login failed');
    }

    return data;
};

export const logoutUser = async (): Promise<void> => {
    const res = await fetch('/api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
        const data = (await res.json()) as { message?: string; error?: string };
        throw new Error(data?.message || data?.error || 'Logout failed');
    }
};