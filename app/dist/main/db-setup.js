"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupDatabase = setupDatabase;
exports.checkDatabaseIntegrity = checkDatabaseIntegrity;
exports.backupDatabase = backupDatabase;
const db_1 = require("./db");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const electron_log_1 = __importDefault(require("electron-log"));
async function setupDatabase() {
    try {
        electron_log_1.default.info('Setting up database...');
        const db = (0, db_1.getDatabase)();
        // قراءة ملفات SQL
        const schemaPath = path.join(__dirname, '../../database/schema.sql');
        const seedPath = path.join(__dirname, '../../database/seed.sql');
        if (!fs.existsSync(schemaPath)) {
            electron_log_1.default.error('Schema file not found:', schemaPath);
            return false;
        }
        const schema = fs.readFileSync(schemaPath, 'utf8');
        let seed = '';
        if (fs.existsSync(seedPath)) {
            seed = fs.readFileSync(seedPath, 'utf8');
        }
        // تنفيذ Schema
        await new Promise((resolve, reject) => {
            db.exec(schema, (err) => {
                if (err) {
                    electron_log_1.default.error('Error executing schema:', err);
                    reject(err);
                }
                else {
                    electron_log_1.default.info('Schema executed successfully');
                    resolve();
                }
            });
        });
        // تنفيذ Seed data إذا وجد
        if (seed) {
            await new Promise((resolve, reject) => {
                db.exec(seed, (err) => {
                    if (err) {
                        electron_log_1.default.error('Error executing seed data:', err);
                        reject(err);
                    }
                    else {
                        electron_log_1.default.info('Seed data executed successfully');
                        resolve();
                    }
                });
            });
        }
        // التحقق من إنشاء الجداول
        const tables = await new Promise((resolve, reject) => {
            db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rows.map(row => row.name || ''));
                }
            });
        });
        electron_log_1.default.info('Database tables created:', tables);
        // التحقق من وجود بيانات المستخدم الافتراضي
        const userCount = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(row?.count || 0);
                }
            });
        });
        electron_log_1.default.info('User count in database:', userCount);
        if (userCount === 0) {
            electron_log_1.default.warn('No users found, creating default admin user');
            // إنشاء مستخدم افتراضي
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await new Promise((resolve, reject) => {
                db.run('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', ['admin', hashedPassword, 'admin'], (err) => {
                    if (err) {
                        electron_log_1.default.error('Error creating default user:', err);
                        reject(err);
                    }
                    else {
                        electron_log_1.default.info('Default admin user created successfully');
                        resolve();
                    }
                });
            });
        }
        electron_log_1.default.info('Database setup completed successfully');
        return true;
    }
    catch (error) {
        electron_log_1.default.error('Database setup failed:', error);
        return false;
    }
}
async function checkDatabaseIntegrity() {
    try {
        const db = (0, db_1.getDatabase)();
        // التحقق من سلامة قاعدة البيانات
        const integrity = await new Promise((resolve, reject) => {
            db.get('PRAGMA integrity_check', (err, row) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(row?.integrity_check || '');
                }
            });
        });
        if (integrity !== 'ok') {
            electron_log_1.default.error('Database integrity check failed:', integrity);
            return false;
        }
        electron_log_1.default.info('Database integrity check passed');
        return true;
    }
    catch (error) {
        electron_log_1.default.error('Database integrity check failed:', error);
        return false;
    }
}
async function backupDatabase() {
    try {
        const db = (0, db_1.getDatabase)();
        const backupPath = path.join(__dirname, '../../database/backup_' + Date.now() + '.sqlite');
        // استخدام طريقة بديلة للنسخ الاحتياطي
        await new Promise((resolve, reject) => {
            // نسخ الملف مباشرة
            const sourcePath = path.join(__dirname, '../../database/pos.sqlite');
            if (fs.existsSync(sourcePath)) {
                fs.copyFileSync(sourcePath, backupPath);
                resolve();
            }
            else {
                reject(new Error('Database file not found'));
            }
        });
        electron_log_1.default.info('Database backup created:', backupPath);
        return backupPath;
    }
    catch (error) {
        electron_log_1.default.error('Database backup failed:', error);
        return null;
    }
}
