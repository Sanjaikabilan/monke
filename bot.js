require('dotenv').config();
const { App } = require('@slack/bolt');
const axios = require('axios');
const schedule = require('node-schedule');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

let standupChannel = null; // to store the selected channel

const standupQuestions = [
  "What did you do yesterday?",
  "What are you doing today?",
  "Any blockers?"
];

app.command('/standup', async ({ command, ack, say }) => {
  await ack();
  try {
    const result = await app.client.conversations.list({
      token: process.env.SLACK_BOT_TOKEN
    });

    const channels = result.channels.map(channel => ({
      text: {
        type: 'plain_text',
        text: channel.name
      },
      value: channel.id
    }));

    await say({
      text: 'Select a channel for the standup updates:',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Please select a channel for the standup updates:'
          },
          accessory: {
            type: 'static_select',
            action_id: 'select_channel',
            options: channels
          }
        }
      ]
    });
  } catch (error) {
    console.error(error);
  }
});

app.action('select_channel', async ({ body, ack, say }) => {
  await ack();
  standupChannel = body.actions[0].selected_option.value;
  await say(`Standup updates will be posted in <#${standupChannel}>.`);
});


const sendDailyQuestions = async () => {
  try {
    const result = await app.client.users.list({
      token: process.env.SLACK_BOT_TOKEN
    });

    const users = result.members.filter(member => !member.is_bot && member.id !== 'USLACKBOT');

    for (const user of users) {
      for (const question of standupQuestions) {
        await app.client.chat.postMessage({
          channel: user.id,
          text: question
        });
      }
    }
  } catch (error) {
    console.error(error);
  }
};

// Schedule the job to run at 9 AM every day
schedule.scheduleJob('0 9 * * *', sendDailyQuestions);


let userResponses = {};

app.message(async ({ message, say }) => {
  const userId = message.user;
  const text = message.text;

  if (!userResponses[userId]) {
    userResponses[userId] = [];
  }

  userResponses[userId].push(text);

  if (userResponses[userId].length === standupQuestions.length) {
    const responseMessage = `<@${userId}> sent status\n` + userResponses[userId].join('\n');
    await app.client.chat.postMessage({
      channel: standupChannel,
      text: responseMessage
    });
    userResponses[userId] = []; // reset user's responses after posting
  }
});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Slack Bolt app is running!');
})();
