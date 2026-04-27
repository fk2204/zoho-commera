// src/auth/scopes.js
// Zoho OAuth scope catalog.
//
// IMPORTANT: refresh tokens are SCOPE-BOUND. If you add a new app later,
// you must re-run `npm run setup:oauth` with expanded scopes to get a new
// refresh token.
//
// Three presets:
//   MINIMAL_SCOPES — just CRM + profile. Use if you only run CRM scripts.
//   CORE_SCOPES    — CRM + Mail + WorkDrive + Cliq + Sign + profile.
//                    Default. Covers the most common apps for ~everyone.
//   FULL_SCOPES    — Everything: also Books, Desk, Projects, People,
//                    Inventory, Campaigns. Use if you actually run those.
//
// Format: scope = ServiceName.module.OPERATION
// Operations: ALL | READ | CREATE | UPDATE | DELETE

// ---- CRM ----
export const CRM = {
  modulesAll:        'ZohoCRM.modules.ALL',
  modulesRead:       'ZohoCRM.modules.READ',
  settingsAll:       'ZohoCRM.settings.ALL',
  settingsRead:      'ZohoCRM.settings.READ',
  usersRead:         'ZohoCRM.users.READ',
  orgRead:           'ZohoCRM.org.READ',
  bulkAll:           'ZohoCRM.bulk.ALL',
  coqlRead:          'ZohoCRM.coql.READ',
  notificationsAll:  'ZohoCRM.notifications.ALL',
};

// ---- Books ----
export const BOOKS = {
  fullAccess:    'ZohoBooks.fullaccess.all',
  invoicesAll:   'ZohoBooks.invoices.ALL',
  contactsAll:   'ZohoBooks.contacts.ALL',
};

// ---- Desk ----
export const DESK = {
  ticketsAll:    'Desk.tickets.ALL',
  basicRead:     'Desk.basic.READ',
  contactsAll:   'Desk.contacts.ALL',
  search:        'Desk.search.READ',
};

// ---- Cliq ----
export const CLIQ = {
  webhooksCreate: 'ZohoCliq.Webhooks.CREATE',
  channelsAll:    'ZohoCliq.Channels.ALL',
  chatsAll:       'ZohoCliq.Chats.ALL',
  messagesAll:    'ZohoCliq.Messages.ALL',
  usersRead:      'ZohoCliq.Users.READ',
};

// ---- Projects ----
export const PROJECTS = {
  portalsRead:   'ZohoProjects.portals.READ',
  projectsAll:   'ZohoProjects.projects.ALL',
  tasksAll:      'ZohoProjects.tasks.ALL',
  usersAll:      'ZohoProjects.users.ALL',
};

// ---- People ----
export const PEOPLE = {
  employeeAll:   'ZohoPeople.employee.ALL',
  formsAll:      'ZohoPeople.forms.ALL',
  attendanceAll: 'ZohoPeople.attendance.ALL',
};

// ---- Inventory ----
export const INVENTORY = {
  fullAccess:    'ZohoInventory.FullAccess.all',
};

// ---- WorkDrive ----
export const WORKDRIVE = {
  filesAll:      'WorkDrive.files.ALL',
  teamAll:       'WorkDrive.team.ALL',
};

// ---- Sign ----
export const SIGN = {
  documentsAll:  'ZohoSign.documents.ALL',
  templatesAll:  'ZohoSign.templates.ALL',
};

// ---- Mail ----
export const MAIL = {
  messagesAll:   'ZohoMail.messages.ALL',
  accountsRead:  'ZohoMail.accounts.READ',
  foldersAll:    'ZohoMail.folders.ALL',
};

// ---- Campaigns ----
export const CAMPAIGNS = {
  campaignsAll:  'ZohoCampaigns.campaign.ALL',
  contactsAll:   'ZohoCampaigns.contact.ALL',
};

// ---- Accounts ----
export const ACCOUNTS = {
  profileRead:   'AaaServer.profile.READ',
};

// ============================================================================
// Presets
// ============================================================================

/** Just CRM + profile. Smallest viable set. */
export const MINIMAL_SCOPES = [
  CRM.modulesAll, CRM.settingsAll, CRM.coqlRead, CRM.usersRead, CRM.orgRead,
  ACCOUNTS.profileRead,
];

/** Default: CRM + Mail + WorkDrive + Cliq + Sign + profile.
 *  Covers what most Zoho One users actually touch. */
export const CORE_SCOPES = [
  CRM.modulesAll, CRM.settingsAll, CRM.usersRead, CRM.orgRead,
  CRM.bulkAll, CRM.coqlRead, CRM.notificationsAll,

  MAIL.messagesAll, MAIL.accountsRead, MAIL.foldersAll,

  WORKDRIVE.filesAll, WORKDRIVE.teamAll,

  CLIQ.webhooksCreate, CLIQ.channelsAll, CLIQ.chatsAll,
  CLIQ.messagesAll, CLIQ.usersRead,

  SIGN.documentsAll, SIGN.templatesAll,

  ACCOUNTS.profileRead,
];

/** Full: everything wired up in the framework. */
export const FULL_SCOPES = [
  ...CORE_SCOPES,
  BOOKS.fullAccess,
  DESK.ticketsAll, DESK.basicRead, DESK.contactsAll, DESK.search,
  PROJECTS.portalsRead, PROJECTS.projectsAll, PROJECTS.tasksAll, PROJECTS.usersAll,
  PEOPLE.employeeAll,
  INVENTORY.fullAccess,
  CAMPAIGNS.campaignsAll, CAMPAIGNS.contactsAll,
];

export const MINIMAL_SCOPES_STRING = MINIMAL_SCOPES.join(',');
export const CORE_SCOPES_STRING    = CORE_SCOPES.join(',');
export const FULL_SCOPES_STRING    = FULL_SCOPES.join(',');
