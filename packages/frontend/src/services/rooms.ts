export async function createRoom() {
  try {
    console.log(process.env);
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    console.log({ baseUrl });
    const url = `${baseUrl}/rooms`;
    console.log({ url });
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.json();
  } catch (error) {
    console.error("Failed to create room", error);
  }
}

export type Room = {
  id: string;
  peers: {
    displayName: string;
  }[];
};
export async function getRoomById(roomId: string): Promise<Room | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/rooms/${roomId}`;
    const response = await fetch(url);
    return response.json();
  } catch (error) {
    console.error("Failed to get room", error);
    return null;
  }
}
