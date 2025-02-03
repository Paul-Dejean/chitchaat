export async function sendInvitationEmail(email: string, roomUrl: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/invite`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, roomUrl }),
    });
    return response.json();
  } catch (error) {
    console.error("Failed to send invitation email", error);
  }
}
