require('dotenv').config();
const { App } = require('@slack/bolt');

const axios = require('axios');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const standupQuestions = [
  "What did you do yesterday?",
  "What are you doing today?",
  "Any blockers?"
];

app.command('/standup', async ({ command, ack, say }) => {
  try {
    await ack();
    const user = command.user_id;

    for (let question of standupQuestions) {
      await say(`<@${user}> ${question}`);
    }
  } catch (error) {
    console.error(error);
  }
});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Slack Bolt app is running!');
})();
