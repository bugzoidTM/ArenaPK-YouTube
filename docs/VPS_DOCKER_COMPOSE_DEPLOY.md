# Guia Completo: Implantação do ArenaPK Web em VPS com Docker Compose

Este guia descreve detalhadamente o passo a passo para configurar, construir e implantar a versão web pública do **ArenaPK** em uma máquina virtual privada (Virtual Private Server — VPS) rodando Linux (recomenda-se Ubuntu 22.04 LTS ou superior) por meio do **Docker** e **Docker Compose**, utilizando Nginx como proxy reverso com suporte a SSL gratuito do Let's Encrypt.

---

## 1. Pré-Requisitos do Ambiente

Antes de iniciar o processo de deploy, certifique-se de possuir:

1.  **Servidor VPS:** Mínimo de 1 vCPU e 1 GB de RAM (recomendado 2 GB de RAM para processo de compilação confortável).
2.  **Acesso SSH:** Chave privada ou senha de acesso de superusuário (`root`).
3.  **Domínio Próprio:** Um domínio ou subdomínio (ex: `arena.seudominio.com`) com os registros DNS do tipo **A** apontados para o endereço IP público da sua VPS.
4.  **Projeto Firebase Configurado:** Credenciais de acesso ao Firestore e coleção `pkRooms` pronta para comunicação em tempo real.

---

## 2. Preparação da VPS (Instalação do Docker)

Acesse o terminal da sua VPS via SSH:
```bash
ssh root@seu_ip_da_vps
```

Atualize o gerenciador de pacotes e instale os pré-requisitos:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git apt-transport-https ca-certificates gnupg lsb-release
```

Instale o motor do Docker oficial:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

Instale o **Docker Compose** v2 (em sistemas modernos, ele é integrado diretamente como plugin do comando `docker compose`):
```bash
sudo apt install -y docker-compose-plugin
```

Verifique se a instalação foi bem-sucedida:
```bash
docker --version
docker compose version
```

---

## 3. Preparando o Código Fonte na VPS

Crie um diretório para organizar suas aplicações na VPS, por exemplo `/var/www/arenapk`, clone seu repositório ou transfira os arquivos:

```bash
mkdir -p /var/www/arenapk
cd /var/www/arenapk
```

Se seu repositório for privado, configure suas chaves SSH na VPS ou faça o envio de um arquivo `.zip` com os arquivos e extraia-o no local.

A estrutura esperada no diretório raiz na VPS é:
```text
/var/www/arenapk/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── server.ts
├── vite.config.ts
├── src/
└── .env
```

---

## 4. O Arquivo de Produção: `Dockerfile`

Crie um arquivo chamado **`Dockerfile`** na raiz do projeto para preparar uma compilação de produção performática otimizada em dois estágios (*multi-stage build*):

```dockerfile
# Estágio de Compilação (Build Stage)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Executa o build de produção dos arquivos estáticos e compila o servidor CJS único
RUN npm run build

# Estágio de Execução (Production Run Stage)
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
# Instala apenas dependências de runtime necessárias (evita carregar bundlers de desenvolvimento)
RUN npm ci --only=production

# Copia os compilados prontos em dist/ (contém dist/index.html e dist/server.cjs)
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
```

---

## 5. Configurando o `docker-compose.yml`

Para executar o servidor node encapsulado à frente de um proxy reverso Nginx integrado e com renovação automática de SSL por canais Certbot, crie um arquivo chamado **`docker-compose.yml`**:

```yaml
version: '3.8'

services:
  # Serviço principal do ArenaPK (Node.js + Express + Vite Static Router)
  arenapk-web:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: arenapk-web-app
    restart: always
    environment:
      - PORT=3000
      - NODE_ENV=production
      # Sincronize as variáveis de ambiente necessárias para o build / runtime do cliente
      - VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY}
      - VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN}
      - VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID}
      - VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET}
      - VITE_FIREBASE_MESSAGING_SENDER_ID=${VITE_FIREBASE_MESSAGING_SENDER_ID}
      - VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID}
      - VITE_FIREBASE_MEASUREMENT_ID=${VITE_FIREBASE_MEASUREMENT_ID}
      - VITE_FIREBASE_FIRESTORE_DATABASE_ID=${VITE_FIREBASE_FIRESTORE_DATABASE_ID}
      - VITE_ENABLE_DEMO_SIMULATION=false
    ports:
      - "3000:3000"
    networks:
      - arenapk-network

  # Nginx para terminação de SSL automática e proxy reverso redundante
  nginx-proxy:
    image: nginx:alpine
    container_name: arenapk-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    depends_on:
      - arenapk-web
    networks:
      - arenapk-network

  # Certbot da Electronic Frontier Foundation para geração e renovação de SSL grátis
  certbot:
    image: certbot/certbot
    container_name: arenapk-certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit 0; cigarette=while true; do certbot renew; sleep 12h & wait $${!}; done;'"
    networks:
      - arenapk-network

networks:
  arenapk-network:
    driver: bridge
```

---

## 6. Configuração de Variáveis de Ambiente (`.env`)

Crie o arquivo `.env` na raiz do seu projeto na VPS contendo suas conexões oficiais do Firebase obtidas no Console da Google Cloud:

```env
VITE_FIREBASE_API_KEY=AIzaSyA8Y7Z...
VITE_FIREBASE_AUTH_DOMAIN=arenapk-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=arenapk-app
VITE_FIREBASE_STORAGE_BUCKET=arenapk-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=891819...
VITE_FIREBASE_APP_ID=1:891819...
VITE_FIREBASE_MEASUREMENT_ID=G-ABCDE...
VITE_FIREBASE_FIRESTORE_DATABASE_ID=(default)
```

> ⚠️ [Atenção] O arquivo `.env` não deve ser enviado para repositórios Git públicos por motivos de segurança. Garanta que ele fique isolado internamente na pasta segura `/var/www/arenapk` da sua VPS.

---

## 7. Arquivo de Configuração do Nginx (`nginx.conf`)

Para lidar com solicitações HTTP legítimas e redirecionar para SSL seguro, crie o arquivo `nginx.conf` no mesmo diretórioraiz:

```nginx
events {
    worker_connections 1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;

    # Compressão de dados de texto Gzip para latência de carregamento mobile otimizada
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Servidor para tratamento da verificação ACME do Certbot e redirecionamento de segurança HTTPS
    server {
        listen 80;
        server_name arena.seudominio.com; # <--- Substitua pelo seu domínio oficial mapeado

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # Configurações do Proxy Reverso HTTPS
    server {
        listen 443 ssl;
        server_name arena.seudominio.com; # <--- Substitua pelo seu domínio oficial mapeado

        # Caminho dos certificados SSL gerados pelo Certbot futuramente
        ssl_certificate /etc/letsencrypt/live/arena.seudominio.com/fullchain.pem; # <--- Mudar domínio
        ssl_certificate_key /etc/letsencrypt/live/arena.seudominio.com/privkey.pem; # <--- Mudar domínio

        # Parâmetros de encriptação recomendados (Ciphers robustos)
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers on;
        ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';

        location / {
            proxy_pass http://arenapk-web:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

---

## 8. Inicialização e Geração dos Certificados SSL

No primeiro deploy, os caminhos das chaves SSL no arquivos `nginx.conf` farão o contêiner do Nginx apresentar erro para inicialização caso o Certbot ainda não tenha as chaves mapeadas. 

Execute este script utilitário inteligente em duas etapas simples:

### Passo 8.1: Comentar temporariamente o bloco de leitura SSL (Porta 443) do Nginx
No terminal, edite `nginx.conf` mudando a porta ou comente as linhas do bloco `ssl_certificate` para obter o certificado inicial pela primeira vez via HTTP porta 80.

Inicie apenas os serviços Web e Nginx sem obrigatoriedade HTTPS por enquanto:
```bash
docker compose up -d arenapk-web nginx-proxy
```

### Passo 8.2: Solicitar o certificado SSL ao Let's Encrypt
Rode o contêiner do Certbot em modo interativo de criação:
```bash
docker compose run --rm certbot certonly --webroot --webroot-path=/var/www/certbot --email seu-email@dominio.com --agree-tos --no-eff-email -d arena.seudominio.com
```

> Se a emissão foi concluída com sucesso, o terminal exibirá a confirmação de que os arquivos `fullchain.pem` e `privkey.pem` foram salvos na pasta `/etc/letsencrypt/live/arena.seudominio.com/`.

### Passo 8.3: Descomentar e Restabelecer o Nginx Completo
Descomente o bloco SSL de `nginx.conf` estabelecendo as portas `:443` corretas e reinicie os containers para aplicar as configurações definitivas:

```bash
docker compose down
docker compose up -d --build
```

---

## 9. Verificação dos Logs e Status de Saúde

Certifique-se de que todos os containers estão saudáveis e rodando normalmente em segundo plano na sua VPS:

```bash
docker compose ps
```

Se precisar acompanhar o log do barramento de presentes ou tráfego HTTP:
```bash
docker compose logs -f arenapk-web
```

---

## 10. Atualização do App (Deploy de Nova Versão)

Caso faça alterações futuras na interface do espectador (adição de novos mimos, ajustes de ranking de doadores), você pode enviar o código novo à VPS e compilar a nova imagem instantaneamente sem interrupções de tráfego (*zero-downtime*) rodando:

```bash
git pull origin main
docker compose up -d --build arenapk-web
```

O Docker construirá a nova imagem estática, gerará os pacotes e substituirá o container antigo em segundos.
