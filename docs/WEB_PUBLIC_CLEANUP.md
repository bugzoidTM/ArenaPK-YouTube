# Documentação de Limpeza e Isolamento: ArenaPK Web

Este documento registra as decisões de engenharia, isolamentos de telas, uso de feature flags e caminhos de migração adotados para focar a versão web pública do **ArenaPK YouTube** como uma plataforma 100% voltada à experiência do espectador.

---

## 1. Decisão de Produto e Core MVP

O ArenaPK evoluiu para separar os papéis da plataforma de forma otimizada para o ecossistema do YouTube:
*   **Web Pública (MVP Atual):** Dedicada exclusivamente aos espectadores. Permite descobrir batalhas PK ativas, acompanhar duas lives integradas lado a lado em tempo real por meio dos players oficiais do YouTube, interagir através de um bate-papo unificado próprio de alta performance, consultar rankings de apoiadores e comprar/doar mimos virtuais que aumentam instantaneamente os placares e o calor da partida.
*   **ArenaPK Studio Windows (Próxima Fase):** Aplicação nativa para o criador de conteúdo. Ele gerencia as capturas de vídeo locais, captura o feedback imediato de presentes do Firestore e processa overlays nativos enriquecidos, gerando a transmissão estável final diretamente para o YouTube na máquina do streamer, sem onerar o navegador.

---

## 2. Estrutura de Feature Flags e Isolamento de Telas

Para evitar a perda de código valioso já desenvolvido para transmissões e testes, introduzimos a seguinte configuração de controle de visibilidade:

### Feature Flag Declarada:
Em `.env.example` e em `src/App.tsx`, definimos a constante:
`VITE_ENABLE_STUDIO_PREVIEW` (padrão: `false` para homologação e builds públicas).

### Impacto da Feature Flag Desativada (`false`):

1.  **Navegação Inteligente:**
    *   A aba do **Painel Criador** no menu superior de desktop é completamente ocultada.
    *   O botão **Painel** (🎥) na barra de navegação responsiva mobile é removido de forma a otimizar o espaço para o público.
2.  **Acesso Bloqueado e Redirecionamento Estrito:**
    Qualquer tentativa direta de acessar rotas em lote do criador via URL será interceptada e redirecionada de forma amigável para a visualização informativa `/baixar-studio` (`DownloadStudioView`):
    *   `/login` *(Vincular Canal)*
    *   `/criar-live` *(Cadastro de Transmissões)*
    *   `/dashboard-criador` *(Painel Criador)*
    *   `/central-criador` *(Monitoramento de Batalhas)*
3.  **Botões e Chamadas à Ação (Call-To-Actions):**
    *   O botão principal da Landing Page "Entrar como Criador" leva diretamente para a página informativa do futuro aplicativo Windows em `/baixar-studio`.
    *   O botão de destaque para vincular canal (`Vincular Canal`) no cabeçalho superior direito é substituído por um botão de ação com ícone específico "Baixar Studio".

---

## 3. O que Permanece Disponível no Web MVP Público

Diferente do Studio, todos os recursos essenciais do espectador continuam no coração do ArenaPK Web público:
1.  **Landing Page Atualizada:** Focada na proposta de valor de espectador de PKs e listagem clara do que é funcional ou em planejamento de forma honesta, sem promessas falsas de streaming via navegador.
2.  **Aba Descobrir (`/descobrir`):** Espaço para explorar as salas que estão ativas na plataforma.
3.  **Sala PK Real (`/sala/:roomId`):** Suporte total a carregamento dinâmico via Firestore, placares, contagens regressivas de encerramento de sala, doações atômicas de presentes do catálogo global conectadas a deduplicação inteligente baseada em IDs de transação.
4.  **Batalha de Demonstração (`/demo`):** Sala estática de demonstração com simulação em lote de chat e presentes locais automáticos para experimentação rápida.
5.  **Carteira de Espectador (`/carteira`):** Gerenciador de moedas virtuais de simulação para compra direta de mimos.
6.  **Página de Rank Geral (`/ranking`):** Exibição de recordes e top patrocinadores que mais investiram em seus streamers de escolha.
7.  **Painel de Moderação (`/admin`):** Console dedicado para visualização e suspensão rápida de mensagens que violem conformidade.

---

## 4. Próximos Passos recomendados para o App Windows (Studio Phase)

Durante a montagem da aplicação Windows em C++ ou Electron, o desenvolvedor deve:
1.  Conectar o ouvinte do Firestore apontando para a subcoleção de presentes:
    `pkRooms/{roomId}/giftEvents` filtrando por `studioDeliveryStatus == "pending"`.
2.  Para cada item recebido, disparar as APIs de transição do `firebaseService` para sinalizar processamento e renderização do overlay em tempo real de forma fluida.
3.  Aproveitar o contrato de integridade de dados unificado na pasta `/docs` do repositório para certificar a consistência dos dados do usuário final.
