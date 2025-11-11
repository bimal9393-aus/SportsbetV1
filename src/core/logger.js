// Minimal structured logger used across page objects/tests.

const { DateTimeFormat } = Intl;

const defaultFormatter = new DateTimeFormat('en', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

let logSink;

function setLogSink(sink) {
  // Allows tests to capture log output (e.g., push entries into Allure attachments).
  const previous = logSink;
  logSink = sink;
  return previous;
}

// Safely stringify metadata payloads for logging.
const formatMeta = (metadata) => {
  if (!metadata) return '';
  try {
    return JSON.stringify(metadata);
  } catch (err) {
    return '';
  }
};

function createLogger(scope = 'app') {
  // Creates a scoped logger that prints timestamps and optionally delegates to a sink.
  const log = (level, message, metadata) => {
    const timestamp = defaultFormatter.format(new Date());
    const metaString = formatMeta(metadata);
    const line = `[${timestamp}] [${scope}] [${level.toUpperCase()}] ${message}${metaString ? ` ${metaString}` : ''}`;
    // eslint-disable-next-line no-console
    console.log(line);
    if (typeof logSink === 'function') {
      logSink({
        timestamp,
        scope,
        level,
        message,
        metadata,
        line,
      });
    }
  };

  // Allows nested scopes like "e2e:Bet slip journey" for easy filtering.
  const child = (childScope) => createLogger(`${scope}:${childScope}`);

  const step = async (name, fn, metadata) => {
    // Convenience wrapper so important business steps have symmetric START/END lines.
    log('info', `STEP START - ${name}`, metadata);
    try {
      const result = await fn();
      log('info', `STEP END   - ${name}`);
      return result;
    } catch (error) {
      log('error', `STEP FAIL  - ${name}`, { error: error?.message });
      throw error;
    }
  };

  return {
    info: (message, metadata) => log('info', message, metadata),
    warn: (message, metadata) => log('warn', message, metadata),
    error: (message, metadata) => log('error', message, metadata),
    debug: (message, metadata) => log('debug', message, metadata),
    step,
    child,
  };
}

module.exports = { createLogger, setLogSink };
