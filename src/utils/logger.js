// src/utils/logger.js
// Structured logger with automatic redaction of secret-shaped fields.

import pino from 'pino';
import { config } from '../config.js';

export const logger = pino({
  level: config.logLevel,
  redact: {
    paths: [
      '*.access_token', '*.refresh_token', '*.client_secret', '*.code',
      'access_token', 'refresh_token', 'client_secret', 'code',
      '*.headers.authorization', 'headers.authorization',
      'req.headers.authorization', 'res.headers.authorization',
      'response.access_token', 'response.refresh_token',
      'tokens.refreshToken', 'tokens.accessToken',
    ],
    censor: '[REDACTED]',
  },
  transport:
    process.stdout.isTTY
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } }
      : undefined,
});

/** Audit log — append-only JSON for compliance. Gitignored. */
export const auditLogger = pino(
  {
    level: 'info',
    redact: {
      paths: ['*.access_token', '*.refresh_token', 'headers.authorization'],
      censor: '[REDACTED]',
    },
  },
  pino.destination({ dest: './audit.log', sync: false, mkdir: true })
);
