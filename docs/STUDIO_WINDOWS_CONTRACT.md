# Contrato de Integração: ArenaPK Web <=> ArenaPK Studio Windows

Este documento descreve a arquitetura de comunicação em tempo real de eventos de presentes e ações entre a plataforma web pública (dedicada a espectadores) e o aplicativo nativo para criadores (**ArenaPK Studio Windows**).

---

## 1. Visão Geral da Arquitetura

O **ArenaPK Studio Windows** é o aplicativo nativo que os criadores executam em suas máquinas Windows. Ao contrário de uma solução web tradicional em que o browser renderiza animações sobre a tela, o Studio Windows:
1. Recebe a entrada das câmeras e áudio locais.
2. Escuta a subcoleção de eventos de presentes do Firestore em tempo real.
3. Renderiza efeitos visuais (placares de pontos, barras dinâmicas, animações 3D de presentes recebidos) diretamente nos frames de vídeo brutos (DirectX/Vulkan).
4. Sube o feed de vídeo combinado final diretamente para a chave RTMP da live no YouTube do criador.

Com isso, o MVP web do ArenaPK atua unicamente como o portal do espectador para descoberta, carteira virtual, bate-papo unificado e envio assíncrono de mimos (*Gifts*).

---

## 2. Modelo de Dados do Evento de Presente (`GiftEvent`)

Toda vez que um espectador envia um presente na interface web do ArenaPK, uma transação atômica do Firestore é executada na subcoleção:
`pkRooms/{roomId}/giftEvents/{giftEventId}`

O documento resultante obedece rigorosamente ao seguinte contrato JSON:

```json
{
  "id": "gift-event-1717200000000-4721",
  "roomId": "sala-pk-exemplo-2026",
  "isForCreatorA": true,
  "targetCreatorId": "creator-red-123",
  "targetSide": "A",
  "senderId": "usr-viewer-abc",
  "senderName": "RodrigoApoiador",
  "senderAvatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
  "giftId": "g-3",
  "giftName": "Super Foguete Arena",
  "giftIcon": "🚀",
  "coinValue": 500,
  "pkPointsBonus": 6500,
  "animationType": "rocket_launch",
  "studioDeliveryStatus": "pending",
  "createdAt": "2026-06-01T18:48:30.000Z",
  "timestamp": "2026-06-01T18:48:30.000Z",
  "deliveredAt": null,
  "renderedAt": null,
  "failureReason": null
}
```

### Definição dos Campos do Contrato:

*   `id` *(string)*: Identificador único universal do evento de presente.
*   `roomId` *(string)*: O ID correspondente à sala de PK unificada ativa.
*   `isForCreatorA` *(boolean)*: Mantido por retrocompatibilidade para indicar se o bônus vai para o Streamer A (esquerda).
*   `targetCreatorId` *(string)*: ID persistente do criador que está recebendo o presente de apoio.
*   `targetSide` *(string)*: Lado do streamer recipiente na tela (`"A"` para o lado esquerdo/Red, `"B"` para o lado direito/Blue).
*   `senderId` *(string)*: ID do usuário espectador que enviou o presente.
*   `senderName` *(string)*: Nome legível do doador exibido no widget de chat ou overlay.
*   `senderAvatar` *(string)*: URL pública do avatar do doador do presente.
*   `giftId` *(string)*: Identificação do tipo de mimos do catálogo global corporativo.
*   `giftName` *(string)*: Nome legível do presente enviado (ex: "Fogo Sagrado", "Foguete").
*   `giftIcon` *(string)*: Emoji ou símbolo associado ao presente para renderização rápida.
*   `coinValue` *(number)*: Custo em moedas virtuais debitadas da carteira do espectador.
*   `pkPointsBonus` *(number)*: Total de pontos de bônus computados instantaneamente ao placar do streamer.
*   `animationType` *(string)*: Chave de gatilho para a engine gráfica (ex: `"fire"`, `"crown"`, `"rocket_launch"`). Ele diz ao Studio Windows qual asset carregar na GPU.
*   `studioDeliveryStatus` *(string)*: Máquina de estados para sincronismo do processamento do app Windows. Status válidos:
    *   `"pending"`: Criado pela web, aguardando download pelo app do criador.
    *   `"delivered_to_studio"`: Sincronizado com sucesso na memória RAM do app nativo do criador.
    *   `"rendered"`: Animação desenhada com sucesso sobre o buffer de vídeo e som de som executado.
    *   `"failed"`: Erro interno de renderização ou rede do Studio do criador.
*   `createdAt` / `timestamp` *(string)*: Selo de data ISO UTC em que o evento foi originado.
*   `deliveredAt` *(string | null)*: Preenchido pelo Studio quando o evento é absorvido localmente.
*   `renderedAt` *(string | null)*: Preenchido pelo Studio assim que a renderização é finalizada.
*   `failureReason` *(string | null)*: Mensagem de erro caso a renderização ou consumo falhe.

---

## 3. Ciclo de Vida da Integração e Máquina de Estados

```
 Espectador na Web       Firestore Subcollection           Windows Studio App
       │                            │                               │
       │ (Envia Presente)           │                               │
       ├───────────────────────────>│                               │
       │                            │                               │
       │                            │─ ─ ─ ─ ─ (Novo Evento!) ─ ─ ─>│
       │                            │                               │
       │                            │                       [Fará o Download]
       │                            │                       Define status para:
       │                            │ <─────────────────────'delivered_to_studio'
       │                            │                               │
       │                            │                        [Roda Animação]
       │                            │                       Define status para:
       │                            │ <─────────────────────'rendered'
       │                            │                               │
```

---

## 4. Métodos do Firebase Service Prontos para o Windows Studio

Para facilitar a integração, as seguintes funções de transição de status de mimos já estão previamente implementadas e expostas no `firebaseService`:

1.  `markGiftDeliveredToStudio(roomId, giftEventId)`: Atualiza `studioDeliveryStatus` para `"delivered_to_studio"`.
2.  `markGiftRenderedByStudio(roomId, giftEventId)`: Atualiza `studioDeliveryStatus` para `"rendered"`.
3.  `markGiftFailedForStudio(roomId, giftEventId, reason)`: Atualiza `studioDeliveryStatus` para `"failed"` informando a falha em `failureReason`.

Esses ganchos garantem um pipeline auditável e robusto em tempo real.
