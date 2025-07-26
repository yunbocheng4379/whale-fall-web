/**
 * 简单的密码加密/解密工具
 * 使用Base64编码和简单的字符偏移进行加密
 */

// 加密密钥（简单的偏移量）
const ENCRYPT_KEY = 'whale_fall_2024';

/**
 * 简单加密函数
 * @param {string} text 要加密的文本
 * @returns {string} 加密后的文本
 */
export function encrypt(text) {
  if (!text) return '';

  try {
    // 第一步：字符偏移加密
    let encrypted = '';
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      const keyChar = ENCRYPT_KEY.charCodeAt(i % ENCRYPT_KEY.length);
      encrypted += String.fromCharCode(char + keyChar);
    }

    // 第二步：Base64编码
    return btoa(encrypted);
  } catch (error) {
    console.warn('加密失败:', error);
    return text;
  }
}

/**
 * 简单解密函数
 * @param {string} encryptedText 要解密的文本
 * @returns {string} 解密后的文本
 */
export function decrypt(encryptedText) {
  if (!encryptedText) return '';

  try {
    // 第一步：Base64解码
    const decoded = atob(encryptedText);

    // 第二步：字符偏移解密
    let decrypted = '';
    for (let i = 0; i < decoded.length; i++) {
      const char = decoded.charCodeAt(i);
      const keyChar = ENCRYPT_KEY.charCodeAt(i % ENCRYPT_KEY.length);
      decrypted += String.fromCharCode(char - keyChar);
    }

    return decrypted;
  } catch (error) {
    console.warn('解密失败:', error);
    return '';
  }
}

/**
 * 验证密码
 * @param {string} inputPassword 输入的密码
 * @param {string} storedPassword 存储的加密密码
 * @returns {boolean} 密码是否匹配
 */
export function verifyPassword(inputPassword, storedPassword) {
  if (!inputPassword || !storedPassword) {
    return false;
  }

  try {
    const decryptedPassword = decrypt(storedPassword);
    if (!decryptedPassword) {
      return false;
    }

    const isMatch = inputPassword === decryptedPassword;
    return isMatch;
  } catch (error) {
    console.error('密码验证过程中发生错误:', error);
    return false;
  }
}

/**
 * 生成密码哈希（用于额外的安全性）
 * @param {string} password 原始密码
 * @returns {string} 哈希值
 */
export function hashPassword(password) {
  if (!password) return '';

  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 转换为32位整数
  }
  return hash.toString();
}
