type Area = 'APP' | 'NAV' | 'API' | 'UI' | 'CHART' | 'STORE';

type ConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';

const original = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug.bind(console),
};

const buffer: string[] = [];
const MAX_BUFFER = 1000;

// Global log level control via env (Expo public env is statically injected)
type Level = 'silent' | 'error' | 'warn' | 'info' | 'debug';
const LEVEL_ORDER: Record<Level, number> = {
  silent: 100,
  error: 40,
  warn: 30,
  info: 20,
  debug: 10,
};
const envLevel = (process.env.EXPO_PUBLIC_LOG_LEVEL?.toLowerCase() as Level) || 'debug';
const ACTIVE_LEVEL: Level = envLevel in LEVEL_ORDER ? envLevel : 'debug';

function shouldLog(method: ConsoleMethod) {
  // map console methods to our levels
  const methodLevel: Level = method === 'error' ? 'error' : method === 'warn' ? 'warn' : method === 'debug' ? 'debug' : 'info';
  return LEVEL_ORDER[methodLevel] >= LEVEL_ORDER[ACTIVE_LEVEL] && ACTIVE_LEVEL !== 'silent';
}

function pushBuffer(entry: string) {
  buffer.push(entry);
  if (buffer.length > MAX_BUFFER) buffer.shift();
}

function format(area: Area, method: ConsoleMethod, args: any[]) {
  const prefix = `[${area}]`;
  const ts = new Date().toISOString();
  const entry = `${ts} ${prefix} ${method.toUpperCase()} ${args
    .map((a) => (typeof a === 'string' ? a : JSON.stringify(a)))
    .join(' ')}`;
  pushBuffer(entry);
  return [prefix, ...args];
}

function createLogger(area: Area) {
  return {
    log: (...args: any[]) => shouldLog('log') && original.log(...format(area, 'log', args)),
    info: (...args: any[]) => shouldLog('info') && original.info(...format(area, 'info', args)),
    warn: (...args: any[]) => shouldLog('warn') && original.warn(...format(area, 'warn', args)),
    error: (...args: any[]) => shouldLog('error') && original.error(...format(area, 'error', args)),
    debug: (...args: any[]) => shouldLog('debug') && original.debug(...format(area, 'debug', args)),
  };
}

export const LOGGER = {
  APP: createLogger('APP'),
  NAV: createLogger('NAV'),
  API: createLogger('API'),
  UI: createLogger('UI'),
  CHART: createLogger('CHART'),
  STORE: createLogger('STORE'),
  getBuffer: () => buffer.slice(),
};

// Optional: install global proxies with [APP] prefix to improve visibility without changing all calls
export function initConsoleProxy() {
  const proxy = createLogger('APP');
  console.log = proxy.log as any;
  console.info = proxy.info as any;
  console.warn = proxy.warn as any;
  console.error = proxy.error as any;
  console.debug = proxy.debug as any;
}