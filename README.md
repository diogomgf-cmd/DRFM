# Reading For Meaning

Uma app de leitura e compreensao inspirada no Reading Theory.

## Como usar localmente (PC)

1. Faz duplo clique em `ReadingForMeaning.exe`
2. O browser vai abrir automaticamente em `http://localhost:8000/index.html`
3. Para parar o servidor, fecha a janela da consola ou pressiona Ctrl+C

(Alternativamente: `python server.py`)

## Como instalar no telemovel (PWA)

A app esta hospedada no GitHub Pages. Para instalar:

### Android (Chrome)
1. Abre o URL da app no Chrome
2. Menu (3 pontos) > "Adicionar ao ecra principal"
3. A app aparece como icone e abre em modo standalone

### iOS (Safari)
1. Abre o URL da app no Safari
2. Botao partilhar > "Adicionar ao ecra inicial"
3. A app aparece como icone

## Configurar Firebase (sync entre dispositivos)

Para sincronizar o progresso entre PC e telemovel:

### Passo 1: Criar projeto Firebase
1. Vai a https://console.firebase.google.com
2. Clica em "Add project" (ou "Criar projeto")
3. Da um nome ao projeto (ex: "drfm")
4. Podes desativar Google Analytics
5. Cria o projeto

### Passo 2: Ativar Firestore Database
1. No menu lateral, clica em "Firestore Database"
2. Clica em "Create database"
3. Escolhe "Start in test mode" (para comecar)
4. Escolhe a regiao mais proxima (eur3-west europe)

### Passo 3: Obter configuracao
1. No menu lateral, clica no icone de rede (Web app `</>`)
2. Regista a app com um nickname (ex: "drfm-web")
3. Copia o objeto `firebaseConfig` que aparece

### Passo 4: Configurar a app
1. Edita o ficheiro `firebase-config.js`
2. Substitui os valores placeholder pelos do teu projeto:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "drfm-xxxx.firebaseapp.com",
  projectId: "drfm-xxxx",
  storageBucket: "drfm-xxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### Passo 5: Regras de seguranca do Firestore
No console Firebase > Firestore Database > Regras, cola:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /progress/{code} {
      allow read, write: if true;
    }
  }
}
```

(Para producao, considera regras mais restritivas. Para uso pessoal, isto basta.)

### Passo 6: Usar sync
1. Na app, vai a Definicoes
2. Clica em "Criar perfil de sincronizacao"
3. Guarda o codigo gerado (ex: RFM-ABC123)
4. No telemovel, vai a Definicoes > "Ligar este dispositivo"
5. Insere o codigo e clica "Ligar"
6. O progresso sincroniza automaticamente

## Deploy no GitHub Pages

### Passo 1: Criar repo
1. Cria um repo no GitHub com o nome `drfm` (ou outro)
2. O repo pode ser publico ou privado

### Passo 2: Upload dos ficheiros
Faz upload de todos os ficheiros da pasta DRFM para a raiz do repo:
- index.html
- app.js, ui.js, quiz.js, adaptive.js, storage.js, sync.js, i18n.js
- firebase-config.js
- sw.js, manifest.json
- styles/main.css
- texts/pt.json, texts/en.json

Nao faças upload do:
- ReadingForMeaning.exe (nao e preciso para o deploy)
- server.py (nao e preciso para o deploy)
- README.md (opcional)

### Passo 3: Ativar GitHub Pages
1. No repo: Settings > Pages
2. Source: "Deploy from a branch"
3. Branch: "main" / "(root)"
4. Save
5. Aguarda 1-2 minutos
6. A app fica em: `https://TEU_USERNAME.github.io/drfm/`

### Importante: firebase-config.js
Como o repo pode ser publico, a config do Firebase fica visivel. Isso e seguro porque:
- As regras do Firestore controlam o acesso
- So quem tem o sync code consegue ler/escrever dados
- Firebase API keys sao desenhadas para serem publicas

## Funcionalidades

- **3 modos de jogo**: Custom, Adaptativo, Aleatorio
- **8 temas**: Ciencia, Tecnologia, Filosofia, Historia, Literatura, Artes, Economia, Excertos de Livros
- **3 dificuldades**: Facil, Medio, Dificil
- **Tracking local**: Progresso guardado no browser (localStorage)
- **Sync na nuvem**: Firebase Firestore (opcional)
- **Bilingue**: Portugues e Ingles
- **PWA**: Instalavel no telemovel, funciona offline

## Adicionar novos textos

Edita os ficheiros `texts/pt.json` e `texts/en.json`. Cada texto e um objeto JSON com:

```json
{
  "id": "tema-dificuldade-001",
  "theme": "ciencia",
  "difficulty": "easy",
  "title": "Titulo do Texto",
  "source": "Fonte",
  "content": "Conteudo do texto...",
  "questions": [
    {
      "question": "Pergunta?",
      "options": ["A", "B", "C", "D"],
      "correct": 0
    }
  ]
}
```

Temas: `ciencia`, `tecnologia`, `filosofia`, `historia`, `literatura`, `artes`, `economia`, `livros`
Dificuldades: `easy`, `medium`, `hard`

## Estrutura

```
DRFM/
├── index.html           # Entry point
├── app.js               # Controller principal
├── ui.js                # Renderizacao de ecras
├── quiz.js              # Motor do quiz
├── adaptive.js          # Algoritmo adaptativo
├── storage.js           # localStorage + cloud sync
├── sync.js              # Firebase Firestore sync
├── firebase-config.js   # Config do Firebase (EDITA ESTE)
├── i18n.js              # Traducoes PT/EN
├── sw.js                # Service worker (offline)
├── manifest.json        # PWA manifest
├── styles/main.css      # Estilos
├── texts/pt.json        # Textos em portugues
├── texts/en.json        # Textos em ingles
├── server.py            # Servidor local (PC)
├── ReadingForMeaning.exe # Executavel (PC)
└── README.md
```
