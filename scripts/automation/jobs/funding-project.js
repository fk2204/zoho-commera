import { config } from "../../../src/config.js";
import * as crm from "../../../src/crm/index.js";
import * as projects from "../../../src/projects/index.js";
import { logger, auditLogger } from "../../../src/utils/logger.js";

const STANDARD_TASKS = [
  { title: "Collect signed contract", daysFromFunding: 1 },
  { title: "Verify bank account for ACH", daysFromFunding: 1 },
  { title: "Confirm first payment date with merchant", daysFromFunding: 2 },
  { title: "Send welcome kit to merchant", daysFromFunding: 3 },
  { title: "Follow up: confirm funds received", daysFromFunding: 5 },
  { title: "Schedule 30-day check-in call", daysFromFunding: 30 },
];

export async function run() {
  const startTime = Date.now();
  let processed = 0;
  let skipped = 0;
  let errors = 0;
  const results = [];

  try {
    logger.info("Starting funding-project job");

    // Query fundings that need projects
    const query = `
      SELECT id, Account_Name, Merchant_Name, Funding_Amount, Payback_Amount, Funded_Date
      FROM Fundings
      WHERE Funding_status = 'Active'
        AND Projects_Project_ID = null
      ORDER BY Funded_Date DESC
    `;

    const response = await crm.coql.query(query);
    const fundings = response.data || [];
    logger.info(`Found ${fundings.length} fundings to process`);

    if (fundings.length === 0) {
      return { processed: 0, skipped: 0, errors: 0 };
    }

    // Process each funding
    for (const funding of fundings) {
      try {
        const merchantName = funding.Merchant_Name || funding.Account_Name || "Merchant";
        const fundedDate = new Date(funding.Funded_Date || Date.now());

        if (!config.dryRun) {
          // Create project
          const projectData = {
            name: `${merchantName} - Onboarding`,
            description: `Onboarding project for funding ${funding.id}\nFunding Amount: $${funding.Funding_Amount}\nPayback Amount: $${funding.Payback_Amount}`,
            created_through_portal: "true",
          };

          const projectResponse = await projects.createProject(projectData);
          const projectId = projectResponse.id_string; // CRITICAL: use id_string, not id

          // Create 6 standard tasks
          let taskErrors = 0;
          for (const task of STANDARD_TASKS) {
            try {
              const dueDate = new Date(fundedDate);
              dueDate.setDate(dueDate.getDate() + task.daysFromFunding);

              await projects.createTask(projectId, {
                name: task.title,
                description: `Auto-created for onboarding. Due ${task.daysFromFunding} day(s) from funding.`,
                due_date: dueDate.toISOString().split("T")[0],
                status: "Open",
              });
            } catch (taskErr) {
              logger.warn("Task creation failed", {
                fundingId: funding.id,
                taskTitle: task.title,
                error: taskErr.message,
              });
              taskErrors++;
            }
          }

          if (taskErrors > 0) {
            logger.warn(`Created project but ${taskErrors} task(s) failed`, {
              fundingId: funding.id,
              projectId,
            });
          }

          // Update funding with project ID
          await crm.records.update("Fundings", [{ id: funding.id, Projects_Project_ID: projectId }]);

          auditLogger.info({
            op: "fundingProject",
            recordId: funding.id,
            projectId,
            merchantName,
            tasksCreated: 6 - taskErrors,
            message: "Project created with onboarding tasks",
          });
        } else {
          logger.info(`[DRY RUN] Would create project for funding`, {
            fundingId: funding.id,
            merchantName,
            tasksCount: 6,
          });
        }

        processed++;
        results.push({
          fundingId: funding.id,
          status: "success",
          merchantName,
        });
      } catch (err) {
        logger.error("Error processing funding", {
          fundingId: funding.id,
          error: err.message,
        });
        errors++;
        results.push({
          fundingId: funding.id,
          status: "error",
          reason: err.message,
        });
      }
    }

    const durationMs = Date.now() - startTime;
    logger.info(`fundingProject complete`, {
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
