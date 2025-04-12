import { z } from 'zod';

export const joinRoomSchema = z.object({
  roomId: z.string(),
  displayName: z.string().regex(/^[a-zA-Z0-9._ ]+$/, {
    message:
      'Username can only contain letters, numbers, dots, and underscores.',
  }),
});

export type JoinRoomDto = z.infer<typeof joinRoomSchema>;

export const createTransportSchema = z.object({
  roomId: z.string(),
  sctpCapabilities: z.any(),
});

export type CreateTransportDto = z.infer<typeof createTransportSchema>;

export const connectTransportSchema = z.object({
  roomId: z.string(),
  transportId: z.string(),
  dtlsParameters: z.object({
    role: z.union([
      z.literal('auto'),
      z.literal('client'),
      z.literal('server'),
    ]),
    fingerprints: z.array(
      z.object({
        algorithm: z.union([
          z.literal('sha-1'),
          z.literal('sha-224'),
          z.literal('sha-256'),
          z.literal('sha-384'),
          z.literal('sha-512'),
        ]),
        value: z.string(),
      }),
    ),
  }),
});

export type ConnectTransportDto = z.infer<typeof connectTransportSchema>;

// TODO: replace any()
export const createProducerSchema = z.object({
  roomId: z.string(),
  transportId: z.string(),
  kind: z.union([z.literal('video'), z.literal('audio')]),
  rtpParameters: z.object({
    mid: z.string(),
    codecs: z.array(z.any()),
    headerExtensions: z.array(z.any()).optional(),
    encodings: z.array(z.any()).optional(),
    rtcp: z
      .object({
        cname: z.string().optional(),
        reducedSize: z.boolean().optional(),
      })
      .optional(),
  }),
});

export type CreateProducerDto = z.infer<typeof createProducerSchema>;

export const createConsumerSchema = z.object({
  roomId: z.string(),
  producerId: z.string(),
  rtpCapabilities: z.record(z.unknown()), // TODO
  consumerId: z.string(),
});

export type CreateConsumerDto = z.infer<typeof createConsumerSchema>;

export const resumeProducerSchema = z.object({
  producerId: z.string(),
  roomId: z.string(),
});

export type ResumeProducerDto = z.infer<typeof resumeProducerSchema>;

export const closeProducerSchema = z.object({
  producerId: z.string(),
  roomId: z.string(),
});

export type CloseProducerDto = z.infer<typeof closeProducerSchema>;

export const pauseProducerSchema = z.object({
  producerId: z.string(),
  roomId: z.string(),
});

export type PauseProducerDto = z.infer<typeof pauseProducerSchema>;

export const resumeConsumerSchema = z.object({
  consumerId: z.string(),
  roomId: z.string(),
});

export type ResumeConsumerDto = z.infer<typeof resumeConsumerSchema>;

export const getRouterRtpCapabilitiesSchema = z.object({
  roomId: z.string(),
});

export type GetRouterRtpCapabilitiesDto = z.infer<
  typeof getRouterRtpCapabilitiesSchema
>;
