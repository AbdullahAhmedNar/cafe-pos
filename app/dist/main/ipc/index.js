"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupIPC = setupIPC;
exports.handleIPCError = handleIPCError;
exports.handleIPCSuccess = handleIPCSuccess;
const simple_handlers_1 = require("./simple-handlers");
const electron_log_1 = __importDefault(require("electron-log"));
/**
 * تهيئة جميع معالجات IPC
 */
function setupIPC() {
    try {
        // تهيئة معالجات IPC البسيطة للاختبار
        (0, simple_handlers_1.setupSimpleIPC)();
        electron_log_1.default.info('All IPC handlers setup successfully');
    }
    catch (error) {
        electron_log_1.default.error('Failed to setup IPC handlers:', error);
        throw error;
    }
}
/**
 * معالج عام للأخطاء في IPC
 */
function handleIPCError(error, channel) {
    electron_log_1.default.error(`IPC Error in ${channel}:`, error);
    return {
        success: false,
        error: error.message || 'حدث خطأ غير متوقع',
        code: error.code || 'UNKNOWN_ERROR'
    };
}
/**
 * معالج عام للنجاح في IPC
 */
function handleIPCSuccess(data = null, message) {
    return {
        success: true,
        data,
        message
    };
}
