# Status de Implementação - ArenaPK YouTube (MVP)

Este documento atua como auditoria técnica e mapeia o estado atual dos módulos e fluxos do ArenaPK YouTube, com a divisão exata de responsabilidade técnica entre a versão **Web (MVP Espectadores e Gerenciamento)** e a versão futura nativa **ArenaPK Studio Windows (Transmissão de Vídeo)**.

---

## 1. O Que Já Existe (Funcionalidades Reais e Integradas)

### 🔹 Sincronização em Tempo Real (Firestore)
- **Sala PK (`pkRooms`)**: Quando uma batalha é criada, o documento grava os dados de estado da sala em tempo real: `roomId`, `creatorA`, `creatorB`, `liveA`, `liveB`, `scoreA`, `scoreB`, `status`, `timer`, `createdAt`, `updatedAt`.
- **Estatísticas e Placares**: Placar dinâmico atualizado via transação atômica do Firestore.
- **Chat Sincronizado (`pkRooms/{roomId}/chatMessages`)**: Mensagens e ações especiais são enviadas diretamente para a subcoleção de cada sala e consumidas de forma reativa.
- **Feed de Presentes (`pkRooms/{roomId}/giftEvents`)**: Eventos de presentes salvos que disparam as animações flutuantes reativamente nos clientes após transação bem-sucedida.

### 🔹 Transação Atômica de Envio de Presente (`sendGiftTransaction`)
- Mecanismo integrado via Firestore `runTransaction` que realiza de forma ACID e atômica:
  1. Validação de saldo de moedas na carteira simulada.
  2. Gravação do `giftEvent` na subcoleção do quarto PK correspondente.
  3. Atualização dos campos de `scoreA` ou `scoreB` da sala PK de acordo com o bônus do presente.
  4. Atualização no Ranking interno do quarto.
  5. Envio automático de mensagem de patrocinador para a subcoleção `chatMessages`.
  6. Registro de transação do histórico de saldo (`transactions`).

### 🔹 Visualização e Descoberta
- **Duelos Ativos & Salas Públicas**: Visualização e navegação de lives ativas diretamente na Home.
- **Integração de Vídeo via API do YouTube**: Os frames das batalhas incorporam os reprodutores de vídeo oficiais do YouTube, garantindo likes, views e a integridade de métricas nativas do criador.

### 🔹 Autenticação e Sincronismo Seguros (Modelo OAuth Pronto)
- Implementação limpa do `youtubeService` integrado à tela do Criador com simulações de fluxo OAuth da API do Google (Sucesso, Escopos Insuficientes/Pendente de `force-ssl` e Erro de Acesso Negado).
- Preparado estruturalmente para carregar chaves do Google API protegidas por segredo exclusivo de backend (ocultas da interface pública).

---

## 2. O Que Ainda É Mock (Ambiente Sandbox de Teste)

- **Saldo Inicial de Carteira**: Atribuído com saldo fictício de 1.200 moedas para qualquer usuário novo para fins de testes do MVP integrados ao Firestore (`wallets`).
- **Endpoints de Transmissão Externos (YouTube Ingestion API)**: O agendamento de lives do YouTube faz chamadas ao `youtubeService` que simula a transação e retorna links de transmissão para os reprodutores de vídeo.

---

## 3. O Que Foi Corrigido / Alinhado nesta Auditoria

1. **Correção do Discurso (Alinhamento dos Limites)**:
   - Eliminadas promessas de "100% web" aplicadas ao encoder de transmissão de vídeo do criador no portal público.
   - Ajustada a landing page e painéis para refletir que a versão **Web** foca nas interações de espectadores, doações de presentes virtuais, moderação de chat e sincronismo, enquanto o envio de câmera nativa de baixíssima latência será movido para o **ArenaPK Studio Windows**.
   - Substituição do rótulo "Encoder" por "Sincronismo" na interface de status do criador.
   - Adicionadas observações de que presentes e moedas virtuais são recursos exclusivos e independentes administrados pelo ArenaPK (e não recursos oficiais do ecossistema do YouTube/Google).

2. **Organização da Terapêutica de Subcoleções**:
   - Ajustadas as consultas de escuta do `realtimeService` para ouvir dados aninhados nas subcoleções do Firestore correspondentes a `pkRooms/{roomId}/chatMessages` e `pkRooms/{roomId}/giftEvents` em vez de coleções raiz globais, permitindo isolamento absoluto de salas abertas na plataforma.

---

## 4. O Que Ficará Reservado Para o "ArenaPK Studio Windows"

O **ArenaPK Studio Windows** será uma aplicação nativa de desktop desenvolvida em etapa posterior, encarregada do trabalho pesado de encoder. Esse software receberá dados e eventos de presentes criados na Web e cuidará de:

- **Captura e Composição de Vídeo**: Processamento de alta performance para renderizar a câmera local e overlay sincronizado de forma suave.
- **Mixagem de Áudio em Baixa Latência**: Captura direta de áudio de microfone e roteamento de som sem engasgos do navegador.
- **Protocolo de Ingestão de Vídeo direto para o YouTube (RTMP/HLS)**: Codificação pesada por hardware (NVENC/x264) que dispensa o uso de OBS Studio separado, enviando um sinal contínuo direto de estúdio para os servidores do YouTube.
- **Integração Push de Alertas 3D**: Consumo direto e prioritário das filas de `giftEvents` geradas na URL web para desenhar partículas e overlays dinâmicos 3D na própria transmissão.
