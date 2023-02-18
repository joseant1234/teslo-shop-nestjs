import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NewMessageDto } from './dto/new-message.dto';
import { MessagesWsService } from './messages-ws.service';

// namespace es como una sala de chat, los clientes se conectan a un namespace
// se puede enviar mensajes a todos los clientes conectados al namespace
// si no se especifica está apuntando al root '/'
// cada cliente tiene un identificador único y si tiene especificado un namespace se conectan a dos namespace al root y al q está especificado en el namespace
@WebSocketGateway({ cors: true, namespace: '' })
export class MessagesWsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly messagesWsService: MessagesWsService) {}

  // es el socket server y tiene por ejemplo todos los cliente conectado
  @WebSocketServer() wss: Server;

  // cada vez q un cliente se conecta se ejecuta handleConnection
  handleConnection(client: Socket) {
    // el client.id es único
    // console.log('Client connected: ', client.id)
    this.messagesWsService.registerClient(client);
    // el client.emit solo emite un mensaje al cliente q se conectó
    // wss.emit emite a todos los clientes conectados
    // emit('nombre del evento', envia cualquier valor q el cliente requiera)
    this.wss.emit('client-updated', this.messagesWsService.getConnectedClients());
  }

  handleDisconnect(client: Socket) {
    // console.log('Client desconnected: ', client.id)
    this.messagesWsService.removeClient(client.id);
    this.wss.emit('client-updated', this.messagesWsService.getConnectedClients());
  }

  // message-from-client nombre del evento q se está escuchando
  // client es el q socket q está emitiendo el evento
  @SubscribeMessage('message-from-client')
  onMessageFromClient(client: Socket, payload: NewMessageDto) {
    console.log(client.id)
    console.log(payload)
  }

}
