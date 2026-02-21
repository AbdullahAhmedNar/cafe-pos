import { ipcMain } from 'electron';
import { setupSimpleIPC } from './simple-handlers';
import log from 'electron-log';

/**
 * تهيئة جميع معالجات IPC
 */
export function setupIPC(): void {
  try {
    // تهيئة معالجات IPC البسيطة للاختبار
    setupSimpleIPC();

    log.info('All IPC handlers setup successfully');
  } catch (error) {
    log.error('Failed to setup IPC handlers:', error);
    throw error;
  }
}

/**
 * معالج عام للأخطاء في IPC
 */
export function handleIPCError(error: any, channel: string): any {
  log.error(`IPC Error in ${channel}:`, error);
  
  return {
    success: false,
    error: error.message || 'حدث خطأ غير متوقع',
    code: error.code || 'UNKNOWN_ERROR'
  };
}

/**
 * معالج عام للنجاح في IPC
 */
export function handleIPCSuccess(data: any = null, message?: string): any {
  return {
    success: true,
    data,
    message
  };
}
