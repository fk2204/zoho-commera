// scripts/automation/jobs/commission-invoice.js
// Creates a Zoho Books invoice for commission payments on Fundings with Commission_Amount > 0 and no Books_Invoice_ID.
// Idempotency: uses reference_number = "CMR-" + funding.id to prevent duplicate invoices.
// After creating invoice, stamps Books_Invoice_ID back to Fundings record as idempotency checkpoint.

import * as crm from '../../../src/crm/index.js';
import * as books from '../../../src/books/index.js';
import { logger } from '../../../src/utils/logger.js';
import { auditLogger } from '../../../src/utils/logger.js';
import { config } from '../../../src/config.js';

export async function run() {
  const start = Date.now();
  const results = { processed: 0, skipped: 0, errors: 0 };

  // Get commission customer ID from environment — required for invoice
  const commissionCustomerId = process.env.ZOHO_BOOKS_COMMISSION_CUSTOMER_ID;
  if (!commissionCustomerId) {
    logger.error({}, 'Missing ZOHO_BOOKS_COMMISSION_CUSTOMER_ID env var — cannot proceed');
    results.errors++;
    return results;
  }

  // Query Fundings with Commission_Amount > 0 and no Books_Invoice_ID (idempotency check)
  const fundings = await crm.coql.queryAll(
    `SELECT id, Name, Commission_Amount, Books_Invoice_ID
     FROM Fundings
     WHERE Commission_Amount > 0 AND Books_Invoice_ID = null
     LIMIT 200`
  );

  logger.info({ job: 'commissionInvoice', queried: fundings.length }, 'Job started');

  for (const funding of fundings) {
    try {
      // Idempotency: check if invoice already exists with this reference number
      const referenceNumber = `CMR-${funding.id}`;
      const { page_context: invoices } = await books.listInvoices({
        filter: { reference_number: referenceNumber },
      });

      if (invoices && invoices.length > 0) {
        logger.debug({ fundingId: funding.id, referenceNumber, invoiceId: invoices[0].invoice_id }, 'Invoice already exists — skipping');
        results.skipped++;
        continue;
      }

      const commissionAmount = funding.Commission_Amount || 0;

      if (commissionAmount <= 0) {
        logger.debug({ fundingId: funding.id, Commission_Amount: commissionAmount }, 'Commission amount not positive — skipping');
        results.skipped++;
        continue;
      }

      // Build Books invoice
      const invoice = {
        customer_id: commissionCustomerId,
        reference_number: referenceNumber,
        line_items: [
          {
            description: `Commission - Funding ${funding.id}`,
            quantity: 1,
            item_id: null,  // No item; use line amount directly
            rate: commissionAmount,
          },
        ],
        notes: `Funding ID: ${funding.id}`,
      };

      if (config.dryRun) {
        logger.info({ fundingId: funding.id, fundingName: funding.Name, invoice }, '[DRY RUN] Would create commission invoice');
        results.processed++;
        continue;
      }

      // Create invoice in Zoho Books
      const createdInvoice = await books.createInvoice(invoice);
      const invoiceId = createdInvoice?.invoice_id;

      if (!invoiceId) {
        logger.error({ fundingId: funding.id, response: createdInvoice }, 'Invoice created but no ID returned');
        results.errors++;
        continue;
      }

      logger.info({ fundingId: funding.id, fundingName: funding.Name, invoiceId }, 'Commission invoice created');

      // Stamp Books_Invoice_ID back to Fundings record for idempotency
      try {
        await crm.records.update('Fundings', [{
          id: funding.id,
          Books_Invoice_ID: invoiceId,
        }]);
        logger.debug({ fundingId: funding.id, invoiceId }, 'Fundings record stamped with Books_Invoice_ID');
      } catch (err) {
        logger.error({ fundingId: funding.id, invoiceId, err: err.message }, 'Failed to stamp Books_Invoice_ID on Fundings');
        results.errors++;
        continue;
      }

      // Log to audit
      auditLogger.info({ op: 'commissionInvoice', fundingId: funding.id, invoiceId, amount: commissionAmount }, 'Commission invoice created');

      results.processed++;

    } catch (err) {
      logger.error({ fundingId: funding.id, fundingName: funding.Name, err: err.message }, 'Commission invoice creation failed for record');
      results.errors++;
    }
  }

  logger.info({ ...results, durationMs: Date.now() - start }, 'Commission Invoice job complete');
  return results;
}
