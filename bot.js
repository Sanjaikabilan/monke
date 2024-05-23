require('dotenv').config();
const { App } = require('@slack/bolt');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const standupQuestions = [
  "What did you do yesterday?",
  "What are you doing today?",
  "Any blockers?"
];

app.command('/standup', async ({ command, ack, client }) => {
  await ack();
  
  try {
    const result = await client.views.open({
      trigger_id: command.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'standup_modal',
        title: {
          type: 'plain_text',
          text: 'Daily Standup'
        },
        blocks: standupQuestions.map((question, index) => ({
          type: 'input',
          block_id: `q${index+1}`,
          label: {
            type: 'plain_text',
            text: question
          },
          element: {
            type: 'plain_text_input',
            action_id: 'answer',
            multiline: true
          }
        })),
        submit: {
          type: 'plain_text',
          text: 'Submit'
        }
      }
    });
  } catch (error) {
    console.error(error);
  }
});

app.view('standup_modal', async ({ ack, body, view, client }) => {
  await ack();
  
  const user = body.user.id;
  const channel = '#general'; // Set your desired channel here
  const answers = standupQuestions.map((question, index) => {
    const answer = view.state.values[`q${index+1}`].answer.value;
    return `${question}\n${answer || "No update"}`;
  }).join('\n\n');
  
  const responseMessage = `<@${user}> sent status\n\n${answers}`;
  
  try {
    await client.chat.postMessage({
      channel: channel,
      text: responseMessage
    });
  } catch (error) {
    console.error(error);
  }
});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Slack Bolt app is running!');
})();
