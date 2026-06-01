# ArenaPK Studio Windows — Integrated Integration Contract & Protocol

Este documento define o contrato de integração e o protocolo de sincronização em tempo real entre o **Portal Portal Web ArenaPK (Client)**, as salas no **Firebase Firestore (Data Lake)** e o **ArenaPK Studio para Windows (Broadcaster)**.

---

## 1. Visão Geral da Arquitetura

O ecossistema do **ArenaPK** opera em uma arquitetura desacoplada de alto desempenho projetada para escalabilidade e baixíssima latência:

```
┌────────────────────────┐                             ┌────────────────────────┐
│                        │     sendGiftTransaction     │                        │
│   ArenaPK Web Client   │────────────────────────────>│   Firebase Firestore   │
│   (Audience Portal)    │                             │   (Durable Cloud Data) │
│                        │                             │                        │
└────────────────────────┘                             └────────────────────────┘
                                                                   │
                                                                   │ Real-time Subscription
                                                                   │ onSnapshot (onSub)
                                                                   ▼
                                                       ┌────────────────────────┐
                                                       │                        │
                                                       │  ArenaPK Studio Win32   │
                                                       │  (Nativo - C++/Electron)│
                                                       │                        │
                                                       └────────────────────────┘
```

1. **ArenaPK Web Client**: Utilizado pelo público em geral para descobrir batalhas, ingressar no chat em tempo real e interagir enviando presentes (mimos) virtuais. As compras debitam moedas de sua carteira utilizando transações atômicas de escrita.
2. **Firebase Firestore Database**: O banco de dados mestre global estruturado. Cada sala de batalha armazena suas mensagens de chat e seu feed de mimos nativamente em subcoleções hierárquicas dedicadas.
3. **ArenaPK Studio Windows**: O aplicativo nativo do criador que roda localmente no desktop. Ele escuta a subcoleção de presentes recebidos, inicia animações em overlay dinâmico (com efeitos 3D, áudio e transições), codifica no sinal de vídeo local e atualiza os estados de renderização de volta à nuvem para fornecer feedback aos espectadores.

---

## 2. Estrutura de Coleções no Firestore

Os eventos de presentes são inseridos em uma subcoleção hierárquica na sala correspondente. Isto assegura isolamento lógico por partida e permite consultas eficientes de baixa latência.

### Caminho de Coleção
`pkRooms/{roomId}/giftEvents/{giftEventId}`

---

## 3. Esquema de Dados do Evento (`GiftEvent`)

Cada documento dentro da subcoleção `giftEvents` segue estritamente o esquema abaixo. O Studio Windows deve monitorar este esquema para acionar ações de renderização corretas.

| Campo | Tipo | Descrição | Exemplo de Valor |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Identificador único global do evento de presente. | `"gift-event-167899011-4560"` |
| `roomId` | `string` | ID da sala onde o presente foi enviado. | `"room-casimiro-vs-gaules"` |
| `targetCreatorId` | `string` | ID do criador de conteúdo que recebeu o presente. | `"casimiro"` |
| `targetSide` | `"A" \| "B"` | O lado da arena em que o presente causa impacto. | `"A"` |
| `senderId` | `string` | ID do espectador que realizou a doação. | `"usr-302302"` |
| `senderName` | `string` | Nome de exibição legible do patrocinador. | `"Você (Super Doador)"` |
| `senderAvatar` | `string` | URL da imagem de perfil/avatar do patrocinador. | `https://picsum.photos/id/10/100` |
| `giftId` | `string` | ID do presente conforme catálogo global de mimos. | `"gift-corona"` |
| `giftName` | `string` | Nome legível do presente enviado. | `"Coroa Imperial"` |
| `giftIcon` | `string` | Ícone emoji correspondente ao mimo do catálogo. | `"👑"` |
| `coinValue` | `number` | Custo correspondente em moedas debitadas do usuário. | `500` |
| `pkPointsBonus` | `number` | Pontos adicionados ao placar do lutador apoiado. | `5000` |
| `animationType` | `string` | Chave semântica para renderizar no Windows. | `"3d_crown_fall"` |
| `studioDeliveryStatus` | `string` | Máquina de estados de entrega e processamento do Studio. | `"pending"` |
| `createdAt` | `string` | data de criação em ISO 8601 UTC. | `"2026-06-01T18:18:56.120Z"` |
| `timestamp` | `string` | String de data simplificada para retrocompatibilidade. | `"2026-06-01T18:18:56.120Z"` |
| `deliveredAt` | `string \` | `null` | Data em que o Studio Windows interceptou o evento. | `null` ou `"2026-06-01T18:19:02.045Z"` |
| `renderedAt` | `string \` | `null` | Data em que o Studio concluiu o efeito gráfico na tela. | `null` ou `"2026-06-01T18:19:04.110Z"` |
| `failureReason` | `string` (opcional) | Justificativa técnica caso ocorra erro no Studio. | `"Direct3D device lost on render loop"` |

---

## 4. Fluxo da Máquina de Estados de Entrega (Lifecycle)

A sincronização de entrega possui quatro estados determinísticos controlados de forma bidirecional pelo **Web Client** e pelo **Studio Windows**:

```
 ┌──────────────┐          ┌──────────────────────┐          ┌──────────────┐
 │   PENDING    │ ────────>│ DELIVERED_TO_STUDIO  │ ────────>│   RENDERED   │
 └──────────────┘          └──────────────────────┘          └──────────────┘
        │                             │
        └─────────────────────────────┴───────────────> (ou FAILED)
```

### Passo 1: Publicação (`pending`)
- **Quem executa**: O portal web do espectador.
- **Ação**: Ao comprar um mimo, inicia uma transação atômica no banco de dados. O documento é inserido em `giftEvents` com `studioDeliveryStatus: "pending"`.

### Passo 2: Recepção no Host (`delivered_to_studio`)
- **Quem executa**: O ArenaPK Studio Windows.
- **Ação**: Através do listener ativo da subcoleção de mimos, o Studio detecta o novo registro `pending`. Ele imediatamente atualiza o Firestore marcando `studioDeliveryStatus: "delivered_to_studio"` e preenche `deliveredAt: ISOString`. Isto sinaliza ao painel de moderação administrativa que o host de streaming recebeu o evento localmente.

### Passo 3: Exibição no Fluxo (`rendered`)
- **Quem executa**: O ArenaPK Studio Windows (Engine de Renderização / CEF Overlay).
- **Ação**: O software nativo desenha a animação e efeitos 3D na interface e atualiza o estado para `studioDeliveryStatus: "rendered"`, registrando a data em `renderedAt: ISOString`.

### Passo 4: Exceção (`failed`)
- **Quem executa**: O ArenaPK Studio Windows.
- **Ação**: Caso o software do criador sofra alguma interrupção gráfica ou falha de processamento de áudio, ele envia `studioDeliveryStatus: "failed"` preenchendo o campo `failureReason` com os detalhes da exceção de runtime.

---

## 5. Endpoints de Sincronismo do FirebaseService (API de Referência)

Os seguintes métodos no barramento interno já estão prontos para consumo no arquivo de serviços corporativos (`src/services/firebaseService.ts`):

### 5.1. `markGiftDeliveredToStudio(roomId, giftEventId)`
Sinaliza que o app nativo Win32 capturou o mimo com sucesso no listener.
```typescript
await firebaseService.markGiftDeliveredToStudio("room-id", "gift-id");
```

### 5.2. `markGiftRenderedByStudio(roomId, giftEventId)`
Confirma que a renderização 3D/partículas do presente foi aplicada com sucesso no feed de vídeo local.
```typescript
await firebaseService.markGiftRenderedByStudio("room-id", "gift-id");
```

### 5.3. `markGiftFailedForStudio(roomId, giftEventId, reason)`
Injeta um alerta de processamento de mídia caso a engine de efeitos nativa falhe no host.
```typescript
await firebaseService.markGiftFailedForStudio("room-id", "gift-id", "Codec de áudio corrompido");
```

---

## 6. Sincronização por Amostras de Código (Consumo Direto)

Para o aplicativo de Windows consumir esses dados via C++ / C# / Node.js, ele deve inicializar a SDK do Firebase utilizando chave de serviço segura e escutar o pipe:

```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, onSnapshot } from 'firebase/firestore';

const db = getFirestore(initializeApp(firebaseConfig));

// Monitorando presentes pendentes da sala atual
const q = query(
  collection(db, 'pkRooms', currentRoomId, 'giftEvents'),
  where('studioDeliveryStatus', '==', 'pending')
);

onSnapshot(q, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'added') {
      const giftEvent = change.doc.data();
      triggerNativeAnimation(giftEvent);
    }
  });
});
```

Este esquema de contrato rígido garante total interoperabilidade, permitindo que a versão web sirva como uma plataforma de engajamento do espectador totalmente compatível com as futuras inovações nativas para Windows.
