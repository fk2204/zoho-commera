// src/crm/index.js
// Convenience re-exports.
//
//   import * as crm from './src/crm/index.js';
//   await crm.records.listAll('Leads');
//   await crm.coql.query('SELECT id FROM Leads LIMIT 10');
//   await crm.metadata.listFields('Leads');
//   await crm.users.findUserByEmail('jane@example.com');

export * as records  from './records.js';
export * as coql     from './coql.js';
export * as bulk     from './bulk.js';
export * as metadata from './metadata.js';
export * as users    from './users.js';
