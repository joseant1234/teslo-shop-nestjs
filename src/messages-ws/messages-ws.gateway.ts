import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from 'src/auth/interfaces';
import { NewMessageDto } from './dto/new-message.dto';
import { MessagesWsService } from './messages-ws.service';

// namespace es como una sala de chat, los clientes se conectan a un namespace
// se puede enviar mensajes a todos los clientes conectados al namespace
// si no se especifica está apuntando al root '/'
// cada cliente tiene un identificador único y si tiene especificado un namespace se conectan a dos namespace al root y al q está especificado en el namespace
@WebSocketGateway({ cors: true, namespace: '' })
export class MessagesWsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly messagesWsService: MessagesWsService,
    private readonly jwtService: JwtService,
  ) {}

  // es el socket server y tiene por ejemplo todos los cliente conectado
  @WebSocketServer() wss: Server;

  // cada vez q un cliente se conecta se ejecuta handleConnection
  async handleConnection(client: Socket) {
    // el client.id es único
    // console.log('Client connected: ', client.id)
    const token = client.handshake.headers.authentication as string;
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(token);
      await this.messagesWsService.registerClient(client, payload.id);
    } catch (error) {
      // tambien se puede manejar los errores con los exeception de ws con nest
      client.disconnect();
      return;
    }

    // el client.emit solo emite un mensaje al cliente q se conectó
    // wss.emit emite a todos los clientes conectados
    // emit('nombre del evento', envia cualquier valor q el cliente requiera)
    this.wss.emit('client-updated', this.messagesWsService.getConnectedClients());

    // cuando se conecta tambien lo hace al canal de ventas
    // client.join('ventas')
    // emite a todos los usuarios en el canal de ventas
    // this.wss.to('ventas').emit('')
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
    // con client.emit se emite al cliente q envió el mensaje
    // client.emit('message-from-server', {
    //   fullName: 'Full name',
    //   message: payload.message || 'no-message'
    // })

    // emitir a todos menos al cliente q envió el mensaje
    // client.broadcast.emit('message-from-server', {
    //   fullName: 'Full name',
    //   message: payload.message || 'no-message'
    // })

    // emitie a todos incluyendo el cliente q envió el mensaje
    this.wss.emit('message-from-server', {
      fullName: this.messagesWsService.getUserFullName(client.id),
      message: payload.message || 'no-message'
    })

  }

}
