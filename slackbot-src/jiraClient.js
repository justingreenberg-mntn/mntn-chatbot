const JiraClient = require('jira-client');

// Add debug logging for initialization
console.log('Initializing Jira client with host:', process.env.JIRA_HOST);

const jira = new JiraClient({
  protocol: 'https',
  host: process.env.JIRA_HOST,
  username: process.env.JIRA_EMAIL,
  password: process.env.JIRA_API_TOKEN,
  apiVersion: '2',
  strictSSL: true
});

async function searchJiraIssues(jql) {
  console.log('Attempting to search Jira with JQL:', jql);
  try {
    console.log('Making Jira API call...');
    const issues = await jira.searchJira(jql);
    console.log(`Successfully retrieved ${issues.issues?.length || 0} issues`);
    return issues;
  } catch (error) {
    console.error('Error searching Jira:', {
      message: error.message,
      status: error.statusCode,
      error: error.error,
      stack: error.stack
    });
    throw error;
  }
}

async function getProjectInfo(projectKey) {
  console.log('Attempting to get project info for:', projectKey);
  try {
    console.log('Making Jira API call...');
    const project = await jira.getProject(projectKey);
    console.log('Successfully retrieved project info:', {
      id: project.id,
      key: project.key,
      name: project.name
    });
    return project;
  } catch (error) {
    console.error('Error getting project:', {
      projectKey,
      message: error.message,
      status: error.statusCode,
      error: error.error,
      stack: error.stack
    });
    throw error;
  }
}

async function getRecentUpdates(projectKey, maxResults = 10) {
  console.log('Attempting to get recent updates for project:', projectKey);
  const jql = `project = ${projectKey} ORDER BY updated DESC`;
  try {
    console.log('Making Jira API call with JQL:', jql);
    const issues = await jira.searchJira(jql, { maxResults });
    console.log(`Successfully retrieved ${issues.issues?.length || 0} recent updates`);
    return issues;
  } catch (error) {
    console.error('Error getting recent updates:', {
      projectKey,
      jql,
      message: error.message,
      status: error.statusCode,
      error: error.error,
      stack: error.stack
    });
    throw error;
  }
}

// Add a test function to verify Jira connection
async function testConnection() {
  console.log('Testing Jira connection...');
  try {
    console.log('Attempting to get myself...');
    const myself = await jira.getCurrentUser();
    console.log('Successfully connected to Jira as:', {
      username: myself.name,
      email: myself.emailAddress,
      displayName: myself.displayName
    });
    return true;
  } catch (error) {
    console.error('Error testing Jira connection:', {
      message: error.message,
      status: error.statusCode,
      error: error.error,
      stack: error.stack
    });
    return false;
  }
}

async function getSprintInfo(projectKey) {
  console.log('Attempting to get active sprint info for project:', projectKey);
  const jql = `project = ${projectKey} AND sprint in openSprints()`;
  try {
    console.log('Making Jira API call with JQL:', jql);
    const issues = await jira.searchJira(jql);
    console.log(`Successfully retrieved ${issues.issues?.length || 0} sprint issues`);
    return issues;
  } catch (error) {
    console.error('Error getting sprint info:', {
      projectKey,
      jql,
      message: error.message,
      status: error.statusCode,
      error: error.error,
      stack: error.stack
    });
    throw error;
  }
}

async function getBlockedIssues(projectKey) {
  console.log('Attempting to get blocked issues for project:', projectKey);
  const jql = `project = ${projectKey} AND status = Blocked OR Flagged = Impediment`;
  try {
    console.log('Making Jira API call with JQL:', jql);
    const issues = await jira.searchJira(jql);
    console.log(`Successfully retrieved ${issues.issues?.length || 0} blocked issues`);
    return issues;
  } catch (error) {
    console.error('Error getting blocked issues:', {
      projectKey,
      jql,
      message: error.message,
      status: error.statusCode,
      error: error.error,
      stack: error.stack
    });
    throw error;
  }
}

async function getHighPriorityIssues(projectKey) {
  console.log('Attempting to get high priority issues for project:', projectKey);
  const jql = `project = ${projectKey} AND priority in (Highest, High) AND status not in (Done, Closed)`;
  try {
    console.log('Making Jira API call with JQL:', jql);
    const issues = await jira.searchJira(jql);
    console.log(`Successfully retrieved ${issues.issues?.length || 0} high priority issues`);
    return issues;
  } catch (error) {
    console.error('Error getting high priority issues:', {
      projectKey,
      jql,
      message: error.message,
      status: error.statusCode,
      error: error.error,
      stack: error.stack
    });
    throw error;
  }
}

async function getTeamWorkload(projectKey) {
  console.log('Attempting to get team workload for project:', projectKey);
  const jql = `project = ${projectKey} AND status not in (Done, Closed) ORDER BY assignee`;
  try {
    console.log('Making Jira API call with JQL:', jql);
    const issues = await jira.searchJira(jql);
    console.log(`Successfully retrieved ${issues.issues?.length || 0} active issues`);
    return issues;
  } catch (error) {
    console.error('Error getting team workload:', {
      projectKey,
      jql,
      message: error.message,
      status: error.statusCode,
      error: error.error,
      stack: error.stack
    });
    throw error;
  }
}

module.exports = {
  jira,
  searchJiraIssues,
  getProjectInfo,
  getRecentUpdates,
  testConnection,
  getSprintInfo,
  getBlockedIssues,
  getHighPriorityIssues,
  getTeamWorkload
}; 