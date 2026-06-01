# ArenaPK YouTube — Batalhas Verses (PK) Gamificadas

ArenaPK YouTube is a state-of-the-art interactive web application designed for YouTube creators to engage, compete, and monetize their live streams via real-time versus battles (PK). 

This platform allows content creators to link their channels via OAuth, launch simulated or real YouTube Live broadcasts side-by-side, send interactive challenges with target goals and stakes (prendas), chat, and accept real-time gifts (mimos) from viewers that translate directly to visual points on dynamic scorebars, culminating in active rankings and rewards.

---

## 🎨 Proposta Real do Aplicativo (The Design and Architectural Philosophy)

1. **Separação Rígida entre Frontend e Backend**: 
   - A camada de apresentação é um Single Page Application (SPA) construído em **React 19 + TypeScript + Vite + Tailwind CSS**.
   - A lógica de persistência e validações sérias de integridade (como controle de saldo nas carteiras, bloqueio de spam e moderação de chat) estão desenhadas sob contratos estritos de APIs e interfaces bem declaradas para migração imediata a um backend em Node.js ou Go.

2. **Segurança de API e OAuth Garantida**:
   - Os tokens e códigos de segredo do cliente Google / YouTube nunca ficam expostos no client-side do navegador. Todas as requisições autenticadas de troca de token são proxies realizados pelo servidor backend.
   - Chaves de API de modelagem de inteligência artificial ou gateways de pagamentos adicionais são restritas ao escopo backend.

3. **Integração Real e Composição Visual sem Sobrecarga**:
   - **Exibição do Vídeo Limpa**: Para seguir estritamente as Diretrizes de Marca e termos do YouTube, os players incorporados das lives das batalhas não contém coberturas por cima, botões suspensos que impeçam cliques, ou sobreposição de z-index que oculte os botões de controle originais do player do YouTube.
   - **Composição Pré-transmissão**: Eventuais animações de presentes e fogos de artifício que aparecem na tela de transmissão final do criador no YouTube devem ser compostas em suas respectivas ferramentas de codificação (como OBS Studio via plugin de Browser Source) a partir do servidor em tempo real (media gateway), garantindo que o player final do espectador permaneça limpo e fluído sem sobreposições HTML ilegais em cima do iframe.
   - **Independência de Cuotas da API do YouTube**: Recursos dinâmicos como chat de duelo próprio, placar, carteira de moedas e doações operam independentes da API de chat do YouTube, evitando limitações severas de cota das APIs oficiais do Google.

---

## 📂 Reorganização Estrutural do Código

O projeto segue um padrão profissional de diretórios:
- `src/pages`: Centrais de agrupamento e views de rotas principais do usuário.
- `src/components`: Componentes reutilizáveis específicos e interfaces visuais (Ex: modais de checkout de carteiras, players sincronizados, etc).
- `src/services`: Camadas dedicadas a gerenciar a comunicação assíncrona, com interfaces explícitas que apontam para os futuros endpoints definidos em `API_CONTRACT.md`.
- `src/types`: Tipagens estritas de dados fundamentais (`src/types.ts`).
- `src/mocks`: Banco de dados mock de altíssima fidelidade de criadores, catalogos de presentes e conversas para testes instantâneos.
- `src/lib`: Bibliotecas auxiliares ou configurações centralizadas.

---

## ⚙️ How to install and Run

Instale as dependências:
```bash
npm install
```

Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

Valide a integridade syntax e tipagem (Sem erros):
```bash
npm run lint
```

Gere a compilação de produção:
```bash
npm run build
```
