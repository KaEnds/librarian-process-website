export const createUser = async (username: string, email: string, password: string, confirmPassword: string) => {
    const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, confirmPassword }),
    });
    console.log("Register attempt:", { username, email, password, confirmPassword });

    if (res.ok) {
        console.log("Registration successful");
    } else {
        console.error("Registration failed");
    }
};