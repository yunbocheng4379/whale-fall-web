/**
 * 抑制已知的第三方库警告
 * 这些警告通常来自于依赖库的内部实现，不是我们代码的问题
 */

// 存储原始的 console 方法
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;
const originalConsoleInfo = console.info;

// 需要抑制的警告模式
const SUPPRESSED_WARNINGS = [
  // Ant Design findDOMNode 警告
  'findDOMNode is deprecated',
  'findDOMNode is deprecated and will be removed',

  // React StrictMode 相关警告（如果需要）
  'Warning: ReactDOM.render is deprecated',

  // 其他已知的第三方库警告
  'componentWillReceiveProps has been renamed',
  'componentWillMount has been renamed',
];

// 需要抑制的 Violation 警告模式（这些是浏览器性能警告，不是真正的错误）
const SUPPRESSED_VIOLATIONS = [
  'handler took', // 例如: '[Violation] handler took 502ms'
  "Don't panic", // Chrome 扩展相关
  'message handler took', // 例如: '[Violation] message handler took 502ms'
  'Forced reflow while executing JavaScript', // 强制回流警告
];

// 检查是否应该抑制警告
const shouldSuppressWarning = (message) => {
  if (typeof message !== 'string') return false;

  return SUPPRESSED_WARNINGS.some((pattern) => message.includes(pattern));
};

// 检查是否应该抑制 Violation 警告
const shouldSuppressViolation = (message) => {
  if (typeof message !== 'string') return false;

  return SUPPRESSED_VIOLATIONS.some((pattern) => message.includes(pattern));
};

// 重写 console.warn
console.warn = (...args) => {
  // 如果第一个参数是字符串且匹配抑制模式，则不输出
  if (args.length > 0 && shouldSuppressWarning(args[0])) {
    return;
  }

  // 否则正常输出警告
  originalConsoleWarn.apply(console, args);
};

// 重写 console.info（用于抑制 Violation 警告）
console.info = (...args) => {
  // 抑制 Violation 警告
  if (args.length > 0 && shouldSuppressViolation(args[0])) {
    return;
  }

  // 否则正常输出信息
  originalConsoleInfo.apply(console, args);
};

// 重写 console.error（如果需要抑制某些错误）
console.error = (...args) => {
  // 如果第一个参数是字符串且匹配抑制模式，则不输出
  if (args.length > 0 && shouldSuppressWarning(args[0])) {
    return;
  }

  // 否则正常输出错误
  originalConsoleError.apply(console, args);
};

// 开发环境下的调试信息
if (process.env.NODE_ENV === 'development') {
  console.log('🔇 警告抑制器已启用，已知的第三方库警告将被过滤');
}

// 导出原始方法，以防需要在某些地方使用
export const originalConsole = {
  warn: originalConsoleWarn,
  error: originalConsoleError,
  info: originalConsoleInfo,
};

// 导出控制函数
export const suppressWarnings = {
  // 添加新的抑制模式
  add: (pattern) => {
    if (typeof pattern === 'string' && !SUPPRESSED_WARNINGS.includes(pattern)) {
      SUPPRESSED_WARNINGS.push(pattern);
    }
  },

  // 移除抑制模式
  remove: (pattern) => {
    const index = SUPPRESSED_WARNINGS.indexOf(pattern);
    if (index > -1) {
      SUPPRESSED_WARNINGS.splice(index, 1);
    }
  },

  // 获取当前抑制的模式列表
  list: () => [...SUPPRESSED_WARNINGS],

  // 临时禁用抑制（用于调试）
  disable: () => {
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
    console.info = originalConsoleInfo;
  },

  // 重新启用抑制
  enable: () => {
    console.warn = (...args) => {
      if (args.length > 0 && shouldSuppressWarning(args[0])) {
        return;
      }
      originalConsoleWarn.apply(console, args);
    };

    console.error = (...args) => {
      if (args.length > 0 && shouldSuppressWarning(args[0])) {
        return;
      }
      originalConsoleError.apply(console, args);
    };

    console.info = (...args) => {
      if (args.length > 0 && shouldSuppressViolation(args[0])) {
        return;
      }
      originalConsoleInfo.apply(console, args);
    };
  },
};

export default suppressWarnings;
