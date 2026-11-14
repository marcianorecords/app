# Impulso — Produtividade & Ideias

Aplicativo web estilo iOS para descoberta de atividades (Explorar e Swipe), execução focada com cronômetro, antídotos para vieses cognitivos, memórias visuais, paisagens sonoras e evolução pessoal na pirâmide de Maslow.

## Como publicar no GitHub Pages

O projeto já inclui o workflow automático em `.github/workflows/deploy.yml` e caminhos relativos (`base: './'` no `vite.config.ts`).

1. Envie os arquivos deste repositório para a branch `main` (ou `master`) no GitHub.
2. No repositório do GitHub, abra **Settings → Pages**.
3. Em **Build and deployment → Source**, selecione **GitHub Actions** (não selecione "Deploy from a branch", pois o código TypeScript/React precisa passar pelo build do Vite).
4. Aguarde a execução da action **Deploy to GitHub Pages** na aba **Actions** e acesse o link gerado.

## Como rodar localmente

```bash
npm install
npm run dev
```

Para gerar o build de produção:

```bash
npm run build
npm run preview
```
