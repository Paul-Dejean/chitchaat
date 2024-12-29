import { mediasoupClient } from "@/services/mediasoup";

export async function consumeProducer(roomId: string, producerId: string) {
  const transport = await mediasoupClient.createConsumerTransport(roomId);
  const consumer = await mediasoupClient.consume(roomId, producerId, transport);
  console.log({ consumer });
  return consumer;
}
