export const POST = async (request: Request) => {
  const { username, email, password, confirmPassword } = await request.json();

  console.log("Registration attempt:", { username, email, password, confirmPassword });

  return new Response(JSON.stringify({ message: "User registered successfully" }), {status: 201 });
}