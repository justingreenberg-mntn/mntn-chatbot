const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Function to filter and limit Jira data
function filterJiraData(jiraData) {
  const filteredData = {};

  if (jiraData.projectInfo) {
    // Only include essential project info
    const { id, key, name, projectTypeKey } = jiraData.projectInfo;
    filteredData.projectInfo = { id, key, name, projectTypeKey };
  }

  if (jiraData.recentUpdates && jiraData.recentUpdates.issues) {
    // Limit to last 20 issues and only include essential fields
    filteredData.recentUpdates = {
      total: jiraData.recentUpdates.total,
      issues: jiraData.recentUpdates.issues.slice(0, 20).map(issue => ({
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        priority: issue.fields.priority?.name,
        updated: issue.fields.updated,
        issuetype: issue.fields.issuetype.name
      }))
    };
  }

  if (jiraData.sprintInfo && jiraData.sprintInfo.issues) {
    filteredData.sprintInfo = {
      total: jiraData.sprintInfo.total,
      issues: jiraData.sprintInfo.issues.slice(0, 20).map(issue => ({
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        assignee: issue.fields.assignee?.displayName,
        storyPoints: issue.fields.customfield_10016
      }))
    };
  }

  if (jiraData.blockedIssues && jiraData.blockedIssues.issues) {
    filteredData.blockedIssues = {
      total: jiraData.blockedIssues.total,
      issues: jiraData.blockedIssues.issues.slice(0, 20).map(issue => ({
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        assignee: issue.fields.assignee?.displayName,
        flagged: issue.fields.flagged
      }))
    };
  }

  if (jiraData.highPriorityIssues && jiraData.highPriorityIssues.issues) {
    filteredData.highPriorityIssues = {
      total: jiraData.highPriorityIssues.total,
      issues: jiraData.highPriorityIssues.issues.slice(0, 20).map(issue => ({
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        priority: issue.fields.priority?.name,
        dueDate: issue.fields.duedate
      }))
    };
  }

  if (jiraData.teamWorkload && jiraData.teamWorkload.issues) {
    // Group issues by assignee
    const workloadByAssignee = {};
    jiraData.teamWorkload.issues.forEach(issue => {
      const assignee = issue.fields.assignee?.displayName || 'Unassigned';
      if (!workloadByAssignee[assignee]) {
        workloadByAssignee[assignee] = [];
      }
      workloadByAssignee[assignee].push({
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        issuetype: issue.fields.issuetype.name
      });
    });

    filteredData.teamWorkload = {
      total: jiraData.teamWorkload.total,
      assignees: workloadByAssignee
    };
  }

  return filteredData;
}

async function generateAIResponse(question, jiraData) {
  try {
    // Filter and limit the Jira data
    const filteredJiraData = filterJiraData(jiraData);

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are a helpful AI assistant that provides concise summaries of Jira projects and tickets. Analyze the data based on the type of information provided:

For recent updates:
- Number of issues updated
- Key themes or areas of activity
- Important status changes
- High priority items

For sprint information:
- Total number of issues in sprint
- Distribution of story points
- Progress (completed vs in progress)
- Key deliverables

For blocked issues:
- Number of blocked items
- Common blockers or themes
- Suggestions for resolution
- Impact on delivery

For high priority issues:
- Number of high priority items
- Upcoming deadlines
- Risk assessment
- Areas needing attention

For team workload:
- Team member task distribution
- Potential bottlenecks
- Balanced vs overloaded team members
- Recommendations for workload balancing

Format the response in a clear, bulleted structure. Avoid listing raw ticket data unless specifically asked. If you're not sure about something, say so.`
        },
        {
          role: "user",
          content: `Here is the Jira data: ${JSON.stringify(filteredJiraData, null, 2)}\n\nQuestion: ${question}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
}

module.exports = {
  generateAIResponse
}; 