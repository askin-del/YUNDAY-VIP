# ⬡ TeamSpace

Plateforme de collaboration privée — chat en temps réel + upload de fichiers lourds.

## Stack

| Côté | Techno |
|------|--------|
| Frontend | React + Vite + Zustand |
| Backend | Node.js + Express + Socket.io |
| Auth | JWT + bcrypt |
| Upload | Chunked upload (2MB/chunk) |
| DB | JSON file-based (→ remplacer par PostgreSQL en prod) |

---

## Lancer le projet

### 1. Backend

```bash
cd backend
cp .env.example .env
# Éditer .env si besoin (JWT_SECRET surtout)
npm install
npm run dev
# → http://localhost:3001
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Premier démarrage

1. Va sur `http://localhost:5173/setup`
2. Crée ton compte admin (aucun code requis — premier utilisateur)
3. Tu es maintenant dans l'app

## Inviter des collaborateurs

1. En bas de la sidebar → **"Inviter un membre"**
2. Génère un code d'invitation
3. Partage le lien : `http://ton-domaine.com/register`
4. La personne entre le code + crée son compte

---

## Fonctionnalités

- ✅ Auth sécurisée (JWT + invitation uniquement)
- ✅ Chat en temps réel (WebSocket)
- ✅ Canaux multiples
- ✅ Upload fichiers lourds (chunked, pas de limite)
- ✅ Téléchargement de fichiers
- ✅ Indicateur "en train d'écrire"
- ✅ Présence en ligne/hors ligne
- ✅ Réactions emoji
- ✅ Suppression de messages
- ✅ Drag & drop pour upload
- ✅ Création de canaux

---

## Passer en production

### Base de données
Remplacer `db/index.js` par PostgreSQL (via `pg`) ou MongoDB (via `mongoose`).

### Stockage fichiers
Remplacer le stockage local par **Cloudflare R2** ou **AWS S3** :
```bash
npm install @aws-sdk/client-s3
```

### Variables d'environnement (.env)
```
JWT_SECRET=un-secret-tres-long-et-aleatoire
FRONTEND_URL=https://ton-domaine.com
NODE_ENV=production
```

### Hébergement suggéré
- Frontend → **Vercel** (gratuit)
- Backend → **Railway** ou **Render**
- Fichiers → **Cloudflare R2** (10GB gratuit)

---

## Structure du projet

```
teamspace/
├── backend/
│   ├── server.js           # Point d'entrée
│   ├── db/index.js         # Base de données (JSON)
│   ├── middleware/auth.js  # JWT middleware
│   ├── routes/
│   │   ├── auth.js         # Login, register, invites
│   │   ├── channels.js     # CRUD canaux
│   │   ├── messages.js     # Historique messages
│   │   └── files.js        # Upload chunked + téléchargement
│   ├── socket/handlers.js  # Logique WebSocket
│   └── uploads/            # Fichiers uploadés (local)
│
└── frontend/
    └── src/
        ├── App.jsx
        ├── store.js          # État global (Zustand)
        ├── api.js            # Client Axios
        ├── SocketContext.jsx # Socket.io client
        ├── pages/
        │   ├── SetupPage.jsx
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   └── ChatPage.jsx
        └── components/
            ├── Sidebar.jsx
            ├── ChatArea.jsx
            ├── MessageItem.jsx
            ├── MembersList.jsx
            ├── FileUploadProgress.jsx
            ├── CreateChannelModal.jsx
            └── InviteModal.jsx
```
