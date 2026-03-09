/**
 * Reserved UUIDs for mutation-heavy test suites.
 * Each suite creates its own rows and cleans them up in afterAll.
 */

export const SCENARIO_IDS = {
  // For publish-workflow tests
  publishWorkflow: {
    blogPost: 'cc000000-0000-0000-0000-000000000001',
    event: 'cc000000-0000-0000-0000-000000000002',
    socialCampaign: 'cc000000-0000-0000-0000-000000000003',
    mailerCampaign: 'cc000000-0000-0000-0000-000000000004',
  },
  // For scheduler tests
  scheduler: {
    dueBlog: 'cc000000-0000-0000-0000-000000000010',
    dueEvent: 'cc000000-0000-0000-0000-000000000011',
    pastEvent: 'cc000000-0000-0000-0000-000000000012',
    dueSocial: 'cc000000-0000-0000-0000-000000000013',
    dueMailer: 'cc000000-0000-0000-0000-000000000014',
  },
  // For social tests
  social: {
    campaign: 'cc000000-0000-0000-0000-000000000020',
    blogPost: 'cc000000-0000-0000-0000-000000000021',
  },
  // For mailer tests
  mailer: {
    campaign: 'cc000000-0000-0000-0000-000000000030',
    blogPost: 'cc000000-0000-0000-0000-000000000031',
  },
} as const
