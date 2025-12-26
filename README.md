# GoBD Digital Vault

A GoBD-compliant digital archive system for storing tax-relevant documents with immutable WORM (Write Once, Read Many) protection.

## Features

- **Immutable Document Storage**: Documents are automatically locked upon upload and cannot be modified or deleted for 10 years
- **SHA-256 Hash Verification**: Cryptographic integrity checking on every file access
- **Audit Trail**: Complete, immutable log of all document actions
- **Tax Authority Export**: One-click export in GoBD-compliant format with index.xml
- **10-Year Retention**: Automatic retention period enforcement as required by §146 AO and §147 AO

## Tech Stack

### Backend
- Node.js + Express.js
- MongoDB with Mongoose
- JWT Authentication
- Multer for file uploads
- Archiver for ZIP generation

### Frontend
- React 18 + Vite
- React Router for navigation
- Axios for API calls
- Lucide React for icons
- Modern CSS with glassmorphism

## Installation

### Prerequisites
- Node.js 18+ and npm
- MongoDB 5.0+

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB connection string
npm run dev
```

The backend will run on http://localhost:5000

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on http://localhost:3000

## Usage

1. **Register/Login**: Create an account or login
2. **Upload Documents**: Upload PDF or XML files - they are immediately locked
3. **View Documents**: Browse locked documents (Edit/Delete buttons are removed)
4. **Audit Trail**: View complete history of all actions
5. **Export**: Generate GoBD-compliant export for tax authorities

## GoBD Compliance

This system enforces:

- **Unveränderbarkeit** (Immutability): Documents cannot be modified after upload
- **Vollständigkeit** (Completeness): All documents are retained
- **Nachvollziehbarkeit** (Traceability): Complete audit trail
- **Maschinelle Auswertbarkeit** (Machine Readability): XML export format

## Legal Basis

- §146 AO (Ordnungsvorschriften für die Buchführung)
- §147 AO (Aufbewahrung von Unterlagen)
- GoBD (Grundsätze zur ordnungsmäßigen Führung und Aufbewahrung von Büchern)

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- File integrity verification
- Read-only file permissions
- Rate limiting
- Immutable audit logs

## License

MIT
