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
exports.initializeDatabase = initializeDatabase;
exports.getDatabase = getDatabase;
exports.closeDatabase = closeDatabase;
exports.executeQuery = executeQuery;
exports.executeQuerySingle = executeQuerySingle;
exports.executeUpdate = executeUpdate;
const sqlite3_1 = __importDefault(require("sqlite3"));
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const electron_log_1 = __importDefault(require("electron-log"));
let db;
/**
 * تهيئة قاعدة البيانات وإنشاء الجداول
 */
async function initializeDatabase() {
    return new Promise((resolve, reject) => {
        try {
            // تحديد مسار قاعدة البيانات في userData
            const userDataPath = electron_1.app.getPath('userData');
            const dbPath = path.join(userDataPath, 'pos.sqlite');
            electron_log_1.default.info(`Database path: ${dbPath}`);
            // إنشاء مجلد userData إذا لم يكن موجوداً
            if (!fs.existsSync(userDataPath)) {
                fs.mkdirSync(userDataPath, { recursive: true });
            }
            // إنشاء قاعدة البيانات
            db = new sqlite3_1.default.Database(dbPath, (err) => {
                if (err) {
                    electron_log_1.default.error('Failed to open database:', err);
                    reject(err);
                    return;
                }
                electron_log_1.default.info('Database opened successfully');
                // إنشاء الجداول
                createTables()
                    .then(() => seedDatabaseIfEmpty())
                    .then(() => {
                    electron_log_1.default.info('Database initialized successfully');
                    resolve();
                })
                    .catch(reject);
            });
        }
        catch (error) {
            electron_log_1.default.error('Failed to initialize database:', error);
            reject(error);
        }
    });
}
/**
 * إنشاء الجداول الأساسية
 */
function createTables() {
    return new Promise((resolve, reject) => {
        // إنشاء الجداول أولاً
        const tablesSql = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT CHECK(role IN ('admin','cashier')) NOT NULL DEFAULT 'cashier',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL CHECK(price >= 0),
        category TEXT NOT NULL,
        image TEXT,
        sku TEXT UNIQUE NOT NULL,
        stock INTEGER DEFAULT 0 CHECK(stock >= 0),
        is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_no TEXT UNIQUE NOT NULL,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        total REAL NOT NULL CHECK(total >= 0),
        discount REAL DEFAULT 0 CHECK(discount >= 0),
        tax REAL DEFAULT 0 CHECK(tax >= 0),
        paid REAL NOT NULL CHECK(paid >= 0),
        payment_method TEXT CHECK(payment_method IN ('cash','card','wallet')) NOT NULL,
        user_id INTEGER NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        qty INTEGER NOT NULL CHECK(qty > 0),
        unit_price REAL NOT NULL CHECK(unit_price >= 0),
        subtotal REAL NOT NULL CHECK(subtotal >= 0),
        FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY(product_id) REFERENCES products(id)
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `;
        // إنشاء الفهارس بعد إنشاء الجداول
        const indexesSql = `
      CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
      CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
      CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(date);
      CREATE INDEX IF NOT EXISTS idx_orders_order_no ON orders(order_no);
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
      CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
    `;
        // إنشاء الجداول أولاً
        db.exec(tablesSql, (err) => {
            if (err) {
                electron_log_1.default.error('Failed to create tables:', err);
                reject(err);
                return;
            }
            electron_log_1.default.info('Tables created successfully');
            // ثم إنشاء الفهارس
            db.exec(indexesSql, (err) => {
                if (err) {
                    electron_log_1.default.error('Failed to create indexes:', err);
                    reject(err);
                    return;
                }
                electron_log_1.default.info('Indexes created successfully');
                // إنشاء trigger لتحديث updated_at
                const triggerSql = `
          CREATE TRIGGER IF NOT EXISTS update_products_updated_at 
            AFTER UPDATE ON products
          BEGIN
            UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
          END;
        `;
                db.exec(triggerSql, (err) => {
                    if (err) {
                        electron_log_1.default.error('Failed to create triggers:', err);
                        reject(err);
                    }
                    else {
                        electron_log_1.default.info('Triggers created successfully');
                        resolve();
                    }
                });
            });
        });
    });
}
/**
 * إضافة البيانات التجريبية إذا كانت قاعدة البيانات فارغة
 */
async function seedDatabaseIfEmpty() {
    return new Promise((resolve, reject) => {
        // التحقق من وجود مستخدمين
        db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
            if (err) {
                electron_log_1.default.error('Failed to check users:', err);
                reject(err);
                return;
            }
            if (row.count === 0) {
                electron_log_1.default.info('Database is empty, seeding with initial data...');
                // إضافة مستخدم admin (كلمة المرور: admin123)
                const adminHash = '$2b$10$vdksKXNLB1qt7qOfZNNEHuA5m6tOU30ZOqghsscqSXvTu9ENd41ru';
                db.run('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', ['admin', adminHash, 'admin'], function (err) {
                    if (err) {
                        electron_log_1.default.error('Failed to insert admin user:', err);
                        reject(err);
                        return;
                    }
                    electron_log_1.default.info('Admin user created');
                    // إضافة الإعدادات الأساسية
                    const settings = [
                        ['cafe_name', 'abdullahnar_ninja11'],
                        ['cafe_address', 'دكرنس المنصوره الدقهليه'],
                        ['currency', 'جنيه مصري'],
                        ['currency_symbol', 'ج.م'],
                        ['tax_rate', '15'],
                        ['theme', 'light'],
                        ['language', 'ar']
                    ];
                    const settingsPromises = settings.map(([key, value]) => {
                        return new Promise((resolve, reject) => {
                            db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [key, value], (err) => {
                                if (err)
                                    reject(err);
                                else
                                    resolve();
                            });
                        });
                    });
                    Promise.all(settingsPromises)
                        .then(() => {
                        electron_log_1.default.info('Settings inserted');
                        // إضافة المنتجات الأساسية
                        const products = [
                            { name: 'قهوة عربية', price: 15.0, category: 'مشروبات ساخنة', sku: 'ARAB-001' },
                            { name: 'كابتشينو', price: 20.0, category: 'مشروبات ساخنة', sku: 'CAPP-001' },
                            { name: 'لاتيه', price: 22.0, category: 'مشروبات ساخنة', sku: 'LATT-001' },
                            { name: 'إسبريسو', price: 12.0, category: 'مشروبات ساخنة', sku: 'ESPR-001' },
                            { name: 'شاي أحمر', price: 8.0, category: 'مشروبات ساخنة', sku: 'TEA-001' },
                            { name: 'عصير برتقال', price: 15.0, category: 'مشروبات باردة', sku: 'ORAN-001' },
                            { name: 'عصير تفاح', price: 15.0, category: 'مشروبات باردة', sku: 'APPL-001' },
                            { name: 'كرواسون', price: 12.0, category: 'معجنات', sku: 'CROI-001' },
                            { name: 'دونات', price: 8.0, category: 'حلويات', sku: 'DONU-001' },
                            { name: 'كيك شوكولاتة', price: 25.0, category: 'حلويات', sku: 'CHOC-001' }
                        ];
                        const productPromises = products.map(product => {
                            return new Promise((resolve, reject) => {
                                db.run('INSERT OR IGNORE INTO products (name, price, category, sku, stock) VALUES (?, ?, ?, ?, ?)', [product.name, product.price, product.category, product.sku, 50], (err) => {
                                    if (err)
                                        reject(err);
                                    else
                                        resolve();
                                });
                            });
                        });
                        return Promise.all(productPromises);
                    })
                        .then(() => {
                        electron_log_1.default.info('Products inserted');
                        electron_log_1.default.info('Database seeded successfully');
                        resolve();
                    })
                        .catch(reject);
                });
            }
            else {
                electron_log_1.default.info('Database already has data, skipping seed');
                resolve();
            }
        });
    });
}
/**
 * الحصول على مرجع قاعدة البيانات
 */
function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized');
    }
    return db;
}
/**
 * إغلاق قاعدة البيانات
 */
function closeDatabase() {
    if (db) {
        db.close((err) => {
            if (err) {
                electron_log_1.default.error('Error closing database:', err);
            }
            else {
                electron_log_1.default.info('Database connection closed');
            }
        });
    }
}
/**
 * تنفيذ استعلام مع معالجة الأخطاء
 */
function executeQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                electron_log_1.default.error('Database query error:', err);
                reject(err);
            }
            else {
                resolve(rows || []);
            }
        });
    });
}
/**
 * تنفيذ استعلام واحد مع معالجة الأخطاء
 */
function executeQuerySingle(query, params = []) {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) {
                electron_log_1.default.error('Database query error:', err);
                reject(err);
            }
            else {
                resolve(row);
            }
        });
    });
}
/**
 * تنفيذ استعلام تعديل مع معالجة الأخطاء
 */
function executeUpdate(query, params = []) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function (err) {
            if (err) {
                electron_log_1.default.error('Database update error:', err);
                reject(err);
            }
            else {
                resolve({
                    lastID: this.lastID,
                    changes: this.changes
                });
            }
        });
    });
}
