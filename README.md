# BoraNexus

BoraNexus é uma experiência web focada em salas de conversa, voz, vídeo, compartilhamento de tela e RPG integrado. O projeto atual foi reconstruído em uma estrutura estática e organizada para facilitar manutenção, publicação em GitHub Pages e validação incremental.

## Visão geral

- Front-end responsivo em HTML, CSS e JavaScript puro
- Suporte a login local temporário e preparação para autenticação real com Google via backend seguro
- Criação e entrada em salas
- Chat em tempo real local (UI) com estado persistente em `localStorage`
- Microfone, câmera e compartilhamento de tela com tratamento de erro
- Estado de RPG e painel de missão
- Estrutura pronta para deploy em GitHub Pages

## Estrutura

- `index.html` — app principal
- `styles.css` — visual e responsividade
- `app.js` — lógica do cliente, mensagens, mídia e sala
- `tests/smoke.test.js` — testes básicos de regressão
- `.github/workflows/pages.yml` — deploy para GitHub Pages

## Executando localmente

### Requisitos

- Node.js 18+
- Navegador moderno com HTTPS ou localhost

### Comandos

```bash
npm install
npm run dev
```

Depois, abra `http://localhost:4173`.

## Segurança

- Não armazene tokens ou segredos em código público
- Use OAuth2 do Google em backend seguro para autenticação real
- Trate permissões de mídia no cliente e exiba mensagens claras de erro
- Evite confiar exclusivamente em `localStorage` para autenticação crítica

## Publicação

A configuração de Pages está pronta em `.github/workflows/pages.yml`.

## Observações

O projeto foi organizado e atualizado sem remover a ideia principal do BoraNexus. A autenticação real com Google e canais de áudio/vídeo em tempo real dependem de backend e infraestrutura WebRTC adequados para produção.
