import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { RoomsService } from '@/rooms/rooms.service';
import { Router } from 'mediasoup/node/lib/types';
describe('RoomsController', () => {
  let app: INestApplication;

  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('/rooms (POST)', () => {
    const expectedRoom = {
      id: expect.any(String),
      router: expect.any(Object),
      peers: [],
      isClosed: false,
      producers: {},
      consumers: {},
      transports: {},
    };
    return request(app.getHttpServer())
      .post('/rooms')
      .expect(201)
      .expect((response) => {
        expect(response.body).toEqual(expectedRoom);
      });
  });

  it('/rooms/:roomId (GET)', async () => {
    const expectedRoom = (await request(app.getHttpServer()).post('/rooms'))
      .body;

    return request(app.getHttpServer())
      .get(`/rooms/${expectedRoom.id}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual(expectedRoom);
      });
  });
});
