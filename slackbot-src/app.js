const { App } = require('@slack/bolt');
require('dotenv').config();
const { searchJiraIssues, getProjectInfo, getRecentUpdates, testConnection, getSprintInfo, getBlockedIssues, getHighPriorityIssues, getTeamWorkload } = require('./jiraClient');
const { generateAIResponse } = require('./aiHandler');

// Initialize your app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// Test Jira connection on startup
(async () => {
  console.log('Testing Jira connection on startup...');
  const isConnected = await testConnection();
  if (isConnected) {
    console.log('Successfully connected to Jira!');
  } else {
    console.error('Failed to connect to Jira. Please check your credentials.');
  }
})();

// Add a message listener middleware for debugging
app.message(async ({ message, next }) => {
  // Ignore messages from the bot itself
  if (message.subtype === 'bot_message') {
    return;
  }
  console.log('Received message event:', message);
  await next();
});

// Listen for a message containing "hello"
app.message(/hello/i, async ({ message, client }) => {
  // Ignore messages from the bot itself
  if (message.subtype === 'bot_message') {
    return;
  }
  console.log('Matched hello message:', message);
  try {
    await client.chat.postMessage({
      channel: message.channel,
      thread_ts: message.thread_ts || message.ts,
      text: `Hey there <@${message.user}>! 👋\nType \`help\` to see what I can do!`
    });
    console.log('Successfully sent hello response');
  } catch (error) {
    console.error('Error sending hello response:', error);
  }
});

// Help command
app.message(/help/i, async ({ message, client }) => {
  // Ignore messages from the bot itself
  if (message.subtype === 'bot_message') {
    return;
  }
  try {
    await client.chat.postMessage({
      channel: message.channel,
      thread_ts: message.thread_ts || message.ts,
      text: `*Here are the commands and questions I understand:*

*Basic Commands:*
• \`hello\` - I'll say hello back
• \`help\` - Show this help message
• \`jira-test\` - Test the Jira connection

*Project Questions:*
• "ask what's the status of project XYZ?"
• "ask show me recent updates in project ABC"
• "ask what's happening in the current sprint for project XYZ?"
• "ask what are the blocked issues in project ABC?"
• "ask show me high priority issues in project XYZ"
• "ask what's the team workload in project ABC?"

*Advanced Queries:*
• "ask what issues are at risk in project XYZ?"
• "ask summarize the progress in project ABC this week"
• "ask what's the sprint velocity in project XYZ?"
• "ask who has the most tasks in project ABC?"

Replace XYZ/ABC with your project key (e.g., R2, BIL, etc.).
I'll analyze the data and provide concise, organized summaries!`
    });
    console.log('Successfully sent help response');
  } catch (error) {
    console.error('Error sending help response:', error);
  }
});

// Add a Jira test command
app.message('jira-test', async ({ message, client }) => {
  try {
    await client.chat.postMessage({
      channel: message.channel,
      thread_ts: message.thread_ts || message.ts,
      text: "🔍 Testing Jira connection..."
    });

    const isConnected = await testConnection();
    
    if (isConnected) {
      await client.chat.postMessage({
        channel: message.channel,
        thread_ts: message.thread_ts || message.ts,
        text: "✅ Successfully connected to Jira!\n\nTry asking me something like:\n• `ask what are the recent updates in project XYZ?`"
      });
    } else {
      await client.chat.postMessage({
        channel: message.channel,
        thread_ts: message.thread_ts || message.ts,
        text: "❌ Failed to connect to Jira. Please check the logs for more details."
      });
    }
  } catch (error) {
    console.error('Error testing Jira connection:', error);
    await client.chat.postMessage({
      channel: message.channel,
      thread_ts: message.thread_ts || message.ts,
      text: "❌ Error testing Jira connection. Please check the logs for details."
    });
  }
});

// Handle AI questions about Jira
app.message(/^ask /i, async ({ message, client }) => {
  // Ignore messages from the bot itself
  if (message.subtype === 'bot_message') {
    return;
  }

  const question = message.text.replace(/^ask /i, '').trim();
  
  try {
    // Send typing indicator
    await client.chat.postMessage({
      channel: message.channel,
      thread_ts: message.thread_ts || message.ts,
      text: "🤔 Let me check that for you..."
    });

    // Get relevant Jira data
    let jiraData = {};
    try {
      // Get data from all projects or specific project mentioned in the question
      const projectMatch = question.match(/project\s+([A-Z0-9]+)/i);
      const projectKey = projectMatch ? projectMatch[1].toUpperCase() : null;

      console.log('Extracted project key:', projectKey);

      if (projectKey) {
        console.log('Fetching specific project data for:', projectKey);
        
        // Get basic project info
        try {
          jiraData.projectInfo = await getProjectInfo(projectKey);
          console.log('Successfully got project info');
        } catch (error) {
          console.error('Error getting project info:', error);
        }

        // Check what kind of information is being requested
        if (question.toLowerCase().includes('sprint')) {
          try {
            jiraData.sprintInfo = await getSprintInfo(projectKey);
            console.log('Successfully got sprint info');
          } catch (error) {
            console.error('Error getting sprint info:', error);
          }
        }

        if (question.toLowerCase().includes('blocked') || question.toLowerCase().includes('impediment')) {
          try {
            jiraData.blockedIssues = await getBlockedIssues(projectKey);
            console.log('Successfully got blocked issues');
          } catch (error) {
            console.error('Error getting blocked issues:', error);
          }
        }

        if (question.toLowerCase().includes('high priority') || question.toLowerCase().includes('urgent')) {
          try {
            jiraData.highPriorityIssues = await getHighPriorityIssues(projectKey);
            console.log('Successfully got high priority issues');
          } catch (error) {
            console.error('Error getting high priority issues:', error);
          }
        }

        if (question.toLowerCase().includes('workload') || question.toLowerCase().includes('who has')) {
          try {
            jiraData.teamWorkload = await getTeamWorkload(projectKey);
            console.log('Successfully got team workload');
          } catch (error) {
            console.error('Error getting team workload:', error);
          }
        }

        // Always get recent updates as fallback
        if (Object.keys(jiraData).length === 1) { // Only has projectInfo
          try {
            jiraData.recentUpdates = await getRecentUpdates(projectKey);
            console.log('Successfully got recent updates');
          } catch (error) {
            console.error('Error getting recent updates:', error);
          }
        }
      } else {
        console.log('No specific project mentioned, fetching recent updates across all projects');
        try {
          jiraData.recentUpdates = await searchJiraIssues('updated >= -7d ORDER BY updated DESC');
          console.log('Successfully got recent updates across all projects');
        } catch (error) {
          console.error('Error getting recent updates across all projects:', error);
        }
      }

      if (Object.keys(jiraData).length === 0) {
        await client.chat.postMessage({
          channel: message.channel,
          thread_ts: message.thread_ts || message.ts,
          text: "I had trouble accessing the Jira data. Please try the `jira-test` command to verify the connection."
        });
        return;
      }
    } catch (error) {
      console.error('Error fetching Jira data:', error);
      await client.chat.postMessage({
        channel: message.channel,
        thread_ts: message.thread_ts || message.ts,
        text: "I had trouble accessing the Jira data. Please try the `jira-test` command to verify the connection."
      });
      return;
    }

    console.log('Generating AI response with Jira data:', {
      dataKeys: Object.keys(jiraData),
      projectInfo: jiraData.projectInfo ? 'present' : 'absent',
      recentUpdates: jiraData.recentUpdates ? 'present' : 'absent'
    });

    // Generate AI response
    const aiResponse = await generateAIResponse(question, jiraData);

    // Send the response
    await client.chat.postMessage({
      channel: message.channel,
      thread_ts: message.thread_ts || message.ts,
      text: aiResponse
    });

  } catch (error) {
    console.error('Error handling AI question:', error);
    await client.chat.postMessage({
      channel: message.channel,
      thread_ts: message.thread_ts || message.ts,
      text: "I encountered an error while processing your question. Please try again later."
    });
  }
});

// Handle being added to a channel
app.event('member_joined_channel', async ({ event, client }) => {
  console.log('Received member_joined_channel event:', event);
  try {
    await client.chat.postMessage({
      channel: event.channel,
      text: `Thanks for adding me! 👋 Type \`help\` to see what I can do!`
    });
    console.log('Successfully sent welcome message');
  } catch (error) {
    console.error('Error handling channel join:', error);
  }
});

// Error handling
app.error(async (error) => {
  console.error('Global error handler:', error);
});

// Start the app
(async () => {
  try {
    const port = process.env.PORT || 8080;
    await app.start(port);
    console.log(`⚡️ Bolt app is running on port ${port}!`);
  } catch (error) {
    console.error('Error starting app:', error);
  }
})(); 