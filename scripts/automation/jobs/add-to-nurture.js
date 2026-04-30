import { config } from "../../../src/config.js";
import * as crm from "../../../src/crm/index.js";
import * as campaigns from "../../../src/campaigns/index.js";
import { logger, auditLogger } from "../../../src/utils/logger.js";

export async function run() {
  const startTime = Date.now();
  let processed = 0;
  let skipped = 0;
  let errors = 0;
  const results = [];

  try {
    logger.info("Starting add-to-nurture job");

    // Query leads that need to be added to campaigns
    const query = `
      SELECT id, First_Name, Last_Name, Email, Lead_Scores, Lead_Status
      FROM Leads
      WHERE Email != null
        AND Campaigns_Added = null
        AND Lead_Status != 'Do Not Contact'
      ORDER BY Created_Time DESC
    `;

    const response = await crm.coql.query(query);
    const leads = response.data || [];
    logger.info(`Found ${leads.length} leads to process`);

    if (leads.length === 0) {
      return { processed: 0, skipped: 0, errors: 0 };
    }

    // Process each lead
    for (const lead of leads) {
      try {
        // Determine list based on lead score
        const score = lead.Lead_Scores || 0;
        let listKey;

        if (score >= 70) {
          listKey = process.env.ZOHO_CAMPAIGNS_LIST_HOT;
        } else if (score >= 30) {
          listKey = process.env.ZOHO_CAMPAIGNS_LIST_NURTURE;
        } else {
          listKey = process.env.ZOHO_CAMPAIGNS_LIST_LOW;
        }

        if (!listKey) {
          logger.warn(`No list key for score ${score}`, { leadId: lead.id });
          errors++;
          results.push({
            leadId: lead.id,
            status: "error",
            reason: "Missing list key env var",
          });
          continue;
        }

        // Add to campaigns list
        if (!config.dryRun) {
          await campaigns.addSubscribers(listKey, {
            Contact_Email: lead.Email,
            First_Name: lead.First_Name || "",
            Last_Name: lead.Last_Name || "",
          });

          // Update lead with Campaigns_Added date
          await crm.records.update("Leads", [{ id: lead.id, Campaigns_Added: new Date().toISOString().split("T")[0] }]);

          auditLogger.info({
            op: "addToNurture",
            recordId: lead.id,
            listKey,
            score,
            message: "Lead added to campaign list",
          });
        } else {
          logger.info(`[DRY RUN] Would add lead to ${listKey}`, {
            leadId: lead.id,
            score,
          });
        }

        processed++;
        results.push({
          leadId: lead.id,
          status: "success",
          listKey,
          score,
        });
      } catch (err) {
        logger.error("Error processing lead", {
          leadId: lead.id,
          error: err.message,
        });
        errors++;
        results.push({
          leadId: lead.id,
          status: "error",
          reason: err.message,
        });
      }
    }

    const durationMs = Date.now() - startTime;
    logger.info(`addToNurture complete`, {
      processed,
      skipped,
      errors,
      durationMs,
    });

    return { processed, skipped, errors };
  } catch (err) {
    logger.error("Job failed", { error: err.message });
    throw err;
  }
}
