// src/utils/errors.js
// Typed error classes for `instanceof` checks instead of message parsing.

export class ZohoError extends Error {
  constructor(message, { response, status, code } = {}) {
    super(message);
    this.name = 'ZohoError';
    this.response = response;
    this.status = status;
    this.code = code;
  }
}

export class ZohoAuthError extends ZohoError {
  constructor(message, opts) { super(message, opts); this.name = 'ZohoAuthError'; }
}

export class ZohoApiError extends ZohoError {
  constructor(message, opts) { super(message, opts); this.name = 'ZohoApiError'; }
}

export class ZohoRateLimitError extends ZohoApiError {
  constructor(message, opts) { super(message, opts); this.name = 'ZohoRateLimitError'; }
}
