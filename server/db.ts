import fs from 'fs';
import path from 'path';
import { User, ReconciliationSession } from '../src/types.js';

interface DBData {
  users: User[];
  passwords: Record<string, string>; // userId -> passwordHash
  sessions: ReconciliationSession[];
  resetTokens: Record<string, { userId: string; expiresAt: number }>;
}

const DB_FILE = path.join(process.cwd(), 'data_db.json');

let db: DBData = {
  users: [],
  passwords: {},
  sessions: [],
  resetTokens: {},
};

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(content);
    } else {
      saveDB();
    }
  } catch (err) {
    console.error('Error loading DB file:', err);
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB file:', err);
  }
}

loadDB();

export const DB = {
  findUserByEmail: (email: string): User | undefined => {
    return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },
  findUserById: (id: string): User | undefined => {
    return db.users.find((u) => u.id === id);
  },
  createUser: (user: User, passwordHash: string): User => {
    db.users.push(user);
    db.passwords[user.id] = passwordHash;
    saveDB();
    return user;
  },
  getUserPasswordHash: (userId: string): string | undefined => {
    return db.passwords[userId];
  },
  updatePasswordHash: (userId: string, newHash: string) => {
    db.passwords[userId] = newHash;
    saveDB();
  },
  createResetToken: (token: string, userId: string, ttlMs = 3600000) => {
    db.resetTokens[token] = {
      userId,
      expiresAt: Date.now() + ttlMs,
    };
    saveDB();
  },
  verifyResetToken: (token: string): string | null => {
    const item = db.resetTokens[token];
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      delete db.resetTokens[token];
      saveDB();
      return null;
    }
    return item.userId;
  },
  deleteResetToken: (token: string) => {
    delete db.resetTokens[token];
    saveDB();
  },
  saveSession: (session: ReconciliationSession) => {
    const existingIndex = db.sessions.findIndex((s) => s.id === session.id);
    if (existingIndex >= 0) {
      db.sessions[existingIndex] = session;
    } else {
      db.sessions.unshift(session);
    }
    saveDB();
  },
  getSessionsByUser: (userId: string): ReconciliationSession[] => {
    return db.sessions.filter((s) => s.userId === userId);
  },
  getSessionById: (id: string): ReconciliationSession | undefined => {
    return db.sessions.find((s) => s.id === id);
  },
  getAllSessions: (): ReconciliationSession[] => {
    return db.sessions;
  },
};
