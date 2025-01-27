import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class ClientsService {
  private clientsMap = new Map<string, Socket>();

  addClient(client: Socket) {
    this.clientsMap.set(client.id, client);
  }

  removeClient(client: Socket) {
    this.clientsMap.delete(client.id);
  }

  getClientById(clientId: string) {
    return this.clientsMap.get(clientId);
  }
}
