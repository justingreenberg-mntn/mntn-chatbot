const { App } = require('@slack/bolt');
require('dotenv').config();
const { searchJiraIssues, getProjectInfo, getRecentUpdates, testConnection } = require('./jiraClient');
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
      text: '*Here are the commands I understand:*\n• `hello` - I\'ll say hello back\n• `help` - Show this help message\n• `ask [question]` - Ask me anything about your Jira projects\n• `jira-test` - Test the Jira connection\n\nExample questions:\n• "ask what\'s the status of project XYZ?"\n• "ask show me recent updates in project ABC"\n• "ask what tickets are blocked in project DEF?"'
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
      const projectMatch = question.match(/project\s+([A-Z]+)/i);
      const projectKey = projectMatch ? projectMatch[1].toUpperCase() : null;

      console.log('Extracted project key:', projectKey);

      if (projectKey) {
        console.log('Fetching specific project data for:', projectKey);
        try {
          jiraData.projectInfo = await getProjectInfo(projectKey);
          console.log('Successfully got project info');
        } catch (error) {
          console.error('Error getting project info:', error);
        }

        try {
          jiraData.recentUpdates = await getRecentUpdates(projectKey);
          console.log('Successfully got recent updates');
        } catch (error) {
          console.error('Error getting recent updates:', error);
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