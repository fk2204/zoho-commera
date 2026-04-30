import * as crm from './src/crm/index.js';
import { logger } from './src/utils/logger.js';

const modules = ['Leads', 'Deals', 'Contacts', 'Accounts', 'Fundings', 'Renewals', 'Lenders', 'Offers', 'Stips', 'DealHistory', 'Commissions'];

async function main() {
  for (const module of modules) {
    try {
      const fields = await crm.metadata.listFields(module);
      console.log(`\n=== ${module} ===`);
      fields.forEach(f => {
        console.log(`${f.field_label} | API: ${f.api_name} | Type: ${f.data_type} | Read-only: ${f.read_only}`);
      });
    } catch (err) {
      console.log(`\n=== ${module} === ERROR: ${err.message}`);
    }
  }
}

main();
