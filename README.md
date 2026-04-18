# MLB Stats Dashboard 2026

Dashboard de estatísticas da MLB com análise de apostas por IA (Groq).

## Estrutura do projeto

```
mlb-dashboard/
├── server.js          ← backend Node.js
├── package.json       ← dependências
├── public/
│   └── index.html     ← frontend do dashboard
└── README.md
```

## Deploy no Railway (passo a passo)

### 1. Suba o código no GitHub

1. Acesse github.com e faça login
2. Clique em **"New repository"** (botão verde)
3. Nome: `mlb-dashboard`
4. Deixa como **Public**
5. Clica em **"Create repository"**
6. Na próxima tela clica em **"uploading an existing file"**
7. Arrasta os arquivos: `server.js`, `package.json` e a pasta `public/`
8. Clica em **"Commit changes"**

### 2. Deploy no Railway

1. Acesse railway.app e faça login com GitHub
2. Clique em **"New Project"**
3. Selecione **"GitHub Repository"**
4. Escolha o repositório `mlb-dashboard`
5. Railway detecta Node.js automaticamente e faz o deploy

### 3. Configurar a chave do Groq

1. No painel do Railway, clique no seu projeto
2. Vá em **"Variables"**
3. Clique em **"New Variable"**
4. Nome: `GROQ_API_KEY`
5. Valor: sua chave que começa com `gsk_...`
6. Clica em **"Add"**
7. Railway reinicia automaticamente

### 4. Acessar o site

1. No Railway vá em **"Settings"** → **"Networking"**
2. Clique em **"Generate Domain"**
3. Seu site estará disponível em algo como `mlb-dashboard.railway.app`

## Domínio personalizado (opcional)

Se quiser um domínio próprio tipo `meusite.com.br`:
1. Compre o domínio no registro.br ou namecheap.com
2. No Railway vá em Settings → Networking → Custom Domain
3. Siga as instruções para apontar o DNS

## Custo estimado

- Railway: gratuito até $5/mês de uso (mais que suficiente para uso pessoal)
- Groq API: gratuito com limite generoso
- Domínio: ~R$40/ano (opcional)
