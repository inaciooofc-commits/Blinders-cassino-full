# Hotfix — Three.js Types + TS7006

Corrige:

```text
Try `npm i --save-dev @types/three`
src/engines/ThreeShowcaseEngine.ts(123,22): error TS7006: Parameter 'obj' implicitly has an 'any' type.
```

## Arquivos alterados

- `package.json`
- `src/engines/ThreeShowcaseEngine.ts`

## Mudanças

1. Adicionado:

```json
"@types/three": "latest"
```

em `devDependencies`.

2. Corrigido:

```ts
scene.traverse(obj => {
```

para:

```ts
scene.traverse((obj: any) => {
```

## Aplicação

Substitua os arquivos do hotfix no projeto e rode:

```bash
npm install
npm run build
```
