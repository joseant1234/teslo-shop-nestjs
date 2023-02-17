import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { MessagesWsService } from './messages-ws.service';

// namespace es como una sala de chat, los clientes se conectan a un namespace
// se puede enviar mensajes a todos los clientes conectados al namespace
// si no se especifica está apuntando al root '/'
// cada cliente tiene un identificador único y si tiene especificado un namespace se conectan a dos namespace al root y al q está especificado en el namespace
@WebSocketGateway({ cors: true, namespace: '' })
export class MessagesWsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly messagesWsService: MessagesWsService) {}

  handleConnection(client: Socket) {
    // el client.id es único
    console.log('Client connected: ', client.id)
  }

  handleDisconnect(client: Socket) {
    console.log('Client desconnected: ', client.id)
  }


}
