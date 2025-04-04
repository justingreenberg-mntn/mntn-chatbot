const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateAIResponse(question, jiraData) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant that answers questions about Jira projects and tickets. Use the provided Jira data to give accurate, concise responses. If you're not sure about something, say so."
        },
        {
          role: "user",
          content: `Here is the Jira data: ${JSON.stringify(jiraData, null, 2)}\n\nQuestion: ${question}`
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