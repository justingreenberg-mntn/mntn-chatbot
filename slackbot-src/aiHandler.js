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
          content: "You are a helpful AI assistant that provides concise summaries of Jira projects and tickets. When discussing recent updates, focus on providing a high-level overview including:\n- Number of issues updated\n- Key themes or areas of activity\n- Important status changes\n- High priority items\n\nFormat the response in a clear, bulleted structure. Avoid listing raw ticket data unless specifically asked. If you're not sure about something, say so."
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