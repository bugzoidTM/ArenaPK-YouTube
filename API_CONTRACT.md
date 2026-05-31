# API Contract: ArenaPK Future Backend Integration

This document outlines the API endpoints that the `ArenaPK` frontend services will communicate with once we transition from our high-fidelity sandboxed local storage mock engine to a production stateful Node.js / Go backend.

---

## 1. Authentication Service (`AuthService`)

### Conexão OAuth do YouTube e Sessão
As chaves do cliente OAuth e segredos de API nunca devem ser expostos no frontend por segurança.

#### 1.1 Iniciar Fluxo OAuth do YouTube
Redireciona o criador para o portal do Google OAuth 2.0 para solicitar escopos do YouTube Live Streaming.
- **Endpoint**: `POST /api/auth/youtube/start`
- **Payload**:
  ```json
  {
    "creatorId": "string"
  }
  ```
- **Response**:
  ```json
  {
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=..."
  }
  ```

#### 1.2 Callback de Redirecionamento OAuth
Processado pelo backend para trocar o código (`code`) por tokens acessores (`AccessToken` / `RefreshToken`).
- **Endpoint**: `GET /api/auth/youtube/callback`
- **Query Params**: `?code=string&state=string`
- **Response**: HTML ou redirecionamento de sucesso para o Painel do Criador.

#### 1.3 Encerrar Sessão
Revoga os tokens locais e destrói o cookie de sessão seguro (`HttpOnly`).
- **Endpoint**: `POST /api/auth/logout`
- **Response**:
  ```json
  {
    "success": true
  }
  ```

---

## 2. YouTube Streaming API Controller (`YouTubeService`)

Gerencia as ações diretas de transmissões do YouTube.

#### 2.1 Criar Transmissão no YouTube
Agenda um "LiveBroadcast" e gera canais com uma respectiva "Stream Key".
- **Endpoint**: `POST /api/youtube/live/create`
- **Headers**: `Authorization: Bearer <JWT>`
- **Payload**:
  ```json
  {
    "title": "string",
    "description": "string",
    "privacyStatus": "public | unlisted | private"
  }
  ```
- **Response**:
  ```json
  {
    "broadcastId": "string",
    "streamKey": "string",
    "rtmpServer": "rtmp://a.rtmp.youtube.com/live2",
    "embedUrl": "https://www.youtube.com/embed/string"
  }
  ```

#### 2.2 Iniciar Transmissão Real
Passa o status do broadcast para `live`.
- **Endpoint**: `POST /api/youtube/live/start`
- **Payload**:
  ```json
  {
    "broadcastId": "string"
  }
  ```
- **Response**: `{ "status": "live" }`

#### 2.3 Encerrar Transmissão
Muda o status do live broadcast para `complete`.
- **Endpoint**: `POST /api/youtube/live/end`
- **Payload**:
  ```json
  {
    "broadcastId": "string"
  }
  ```
- **Response**: `{ "status": "complete" }`

#### 2.4 Obter Status da Transmissão do YouTube
Verifica se o feed de RTMP está ativo.
- **Endpoint**: `GET /api/youtube/live/:broadcastId/status`
- **Response**:
  ```json
  {
    "broadcastId": "string",
    "status": "ready | testing | live"
  }
  ```

---

## 3. PK Rooms Service (`PKRoomService`)

Gerencia desafios e as correspondentes arenas PK em andamento.

#### 3.1 Criar Nova Sala PK
- **Endpoint**: `POST /api/pk/rooms`
- **Payload**:
  ```json
  {
    "creatorId": "string"
  }
  ```
- **Response**:
  ```json
  {
    "roomId": "string",
    "status": "created"
  }
  ```

#### 3.2 Enviar Convite PK
- **Endpoint**: `POST /api/pk/rooms/:roomId/invite`
- **Payload**:
  ```json
  {
    "targetCreatorId": "string",
    "stakeDescription": "string",
    "durationMinutes": 5
  }
  ```
- **Response**: `{ "inviteId": "string", "status": "invited" }`

#### 3.3 Aceitar Convite PK
- **Endpoint**: `POST /api/pk/rooms/:roomId/accept`
- **Response**: `{ "roomId": "string", "status": "active" }`

#### 3.4 Encerrar Sala PK Manualmente
- **Endpoint**: `POST /api/pk/rooms/:roomId/end`
- **Response**: `{ "roomId": "string", "status": "closed", "winnerId": "string" }`

#### 3.5 Obter Dados da Sala PK
- **Endpoint**: `GET /api/pk/rooms/:roomId`
- **Response**:
  ```json
  {
    "roomId": "string",
    "creatorA": { "id": "string", "name": "string" },
    "creatorB": { "id": "string", "name": "string" },
    "scoreA": 1050,
    "scoreB": 950,
    "timer": 180,
    "status": "active | finished | closed"
  }
  ```

---

## 4. Real-time Gateway Service (`RealtimeService`)

Proporciona tráfego bidirecional de chat, pontuação instantânea e eventos.

#### 4.1 URL de Conexão WebSocket
Conexão WebSocket contendo autenticação via token e identificador da sala.
- **Endpoint/URL**: `WS /api/rooms/:roomId?token=<Token>`
- **Eventos Recebidos (Inbound)**:
  - `CHAT_MESSAGE`: Enviar nova mensagem.
  - `GIFT_SENT`: Broadcast mútua de presente.
- **Eventos Enviados pelo Servidor (Outbound)**:
  - `SCORE_UPDATED`
  - `USER_JOINED` / `USER_LEFT`
  - `TIMER_UPDATED`

---

## 5. Gift Shop & Animations Service (`GiftService`)

Catálogo de presentes da plataforma.

#### 5.1 Listar Catálogo de Presentes Cadastrados
- **Endpoint**: `GET /api/gifts/catalog`
- **Response**:
  ```json
  [
    {
      "id": "gift-heart",
      "name": "Coração",
      "coinValue": 10,
      "icon": "❤️",
      "pkPointsBonus": 10,
      "animationType": "pop"
    }
  ]
  ```

#### 5.2 Enviar Presente (Debita Carteira e Notifica Socket)
- **Endpoint**: `POST /api/gifts/send`
- **Payload**:
  ```json
  {
    "giftId": "string",
    "recipientCreatorId": "string",
    "roomId": "string"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "txId": "string",
    "currentCoins": 2450
  }
  ```

---

## 6. Wallet & Finanças (`WalletService`)

Gerencia recargas (vendas), carteira virtual de moedas dos espectadores e ganhos monetizáveis realocados para os canais.

#### 6.1 Carregar Dados Financeiros da Carteira
- **Endpoint**: `GET /api/wallet`
- **Response**:
  ```json
  {
    "coinsBalance": 2500,
    "earningsBRL": 745.20
  }
  ```

#### 6.2 Gerar Pix ou Checkout para Compra de Pacote de Moedas
- **Endpoint**: `POST /api/wallet/checkout`
- **Payload**:
  ```json
  {
    "packId": "string",
    "paymentMethod": "pix | credit_card"
  }
  ```
- **Response**:
  ```json
  {
    "checkoutId": "string",
    "paymentPayload": "00020101021226830014br.gov.bcb.pix...",
    "amountBRL": 19.90
  }
  ```

#### 6.3 Histórico de Transações de Moedas/Saques
- **Endpoint**: `GET /api/wallet/transactions`
- **Response**:
  ```json
  [
    {
      "id": "string",
      "type": "debit_gift | purchase_coins",
      "coinsAmount": 50,
      "brlAmount": 0.00,
      "description": "Foguete enviado para Gau",
      "timestamp": "2026-05-31T22:04:00Z"
    }
  ]
  ```

---

## 7. Moderation Engine (`ModerationService`)

#### 7.1 Excluir Comentário Ofensivo
- **Endpoint**: `POST /api/moderation/messages/:messageId/delete`
- **Response**: `{ "success": true }`

#### 7.2 Bloquear Usuário / Silenciar Infrator
- **Endpoint**: `POST /api/moderation/users/:username/mute`
- **Payload**:
  ```json
  {
    "mute": true,
    "reason": "Exemplo de spam"
  }
  ```
- **Response**: `{ "success": true }`

#### 7.3 Encerrar Sala por Violação de Diretriz (Tombstone)
- **Endpoint**: `POST /api/moderation/rooms/:roomId/end`
- **Response**: `{ "success": true }`

---

## 8. Missions Tracker (`MissionService`)

Gerencia o progresso das missões diárias de espectador e recompensas.

#### 8.1 Obter Missões Disponíveis
- **Endpoint**: `GET /api/missions`
- **Response**:
  ```json
  [
    {
      "id": "mission-watch",
      "title": "Explorador de Novidades",
      "progress": 0,
      "targetCount": 3,
      "currentCount": 0,
      "status": "pending | completed",
      "xpReward": 300
    }
  ]
  ```

#### 8.2 Atualizar Progresso de Missão
- **Endpoint**: `POST /api/missions/:missionId/progress`
- **Payload**:
  ```json
  {
    "increment": 1
  }
  ```
- **Response**:
  ```json
  {
    "missionId": "string",
    "currentCount": 1,
    "status": "in_progress",
    "rewardsClaimed": false
  }
  ```

---

## Observações Importantes de Infraestrutura e Composição Visual:

1. **Tokens OAuth e Segurança**: Os tokens de segurança obtidos pelas integrações de canais com a API do YouTube ficam seguros no backend, vinculados ao ID de usuário criptografado em cookies `HttpOnly` no navegador.
2. **Independência de Componentes**: O chat próprio das PK Rooms, envio de mimos, placar em tempo real e rankings funcionam independentes da API do YouTube para evitar atingir as cotas rigorosas do YouTube.
3. **Exibição do Vídeo Sem Coberturas**: Para respeitar as Diretrizes de Marca do YouTube, o player (`iframe`) deve ser exibido sem qualquer camada div flutuante por cima que bloqueie controles ou visualização.
4. **Composição Pré-transmissão**: As animações gráficas que mostram presentes na tela da live do criador devem ser compostas em suas respectivas ferramentas Open Broadcaster Software (OBS) através de fontes auxiliares de navegador ou WebRTC de baixa latência (media gateway) antes de enviar para os servidores de RTMP do YouTube, mantendo o player final limpo.
