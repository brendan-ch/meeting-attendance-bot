import { findServer, createServer } from '../helpers/server';
import { sendEmbed, sendError } from '../helpers/sendMessage';
import { Command } from '../typedefs';
import { createMeeting, getMeetings } from '../helpers/meeting';

/**
 * Create a new meeting.
 */
const newMeeting: Command = {
  name: "new",
  description: "Create and track a new meeting.",
  allowDMs: false,
  type: "General",
  execute: async function(message, args) {
    // Check if member is in voice channel
    if (message.member?.voice.channel) {
      // Get Notion token and database ID from database
      let server = await findServer(message.guild!.id);
      if (!server) {
        server = await createServer({ serverId: message.guild!.id });
      };

      const token = server.notionToken;
      const db = server.notionDB;

      if (!token || !db) {
        await sendError(message.channel, {
          title: "Notion credentials missing",
          description: `Use \`${server.prefix}notion token <token>\` to set the token, and \`${server.prefix}notion database <database ID>\` to set the database ID.`
        });
        return;
      }

      const meetings = getMeetings();
      const index = meetings.findIndex(meeting => meeting.voiceChannel?.guild.id === message.guild?.id);
      if (index !== -1) {
        // meeting already exists
        await sendError(message.channel, {
          title: "Meeting already exists",
          description: "Only one meeting can be tracked at a time."
        });

        return;
      }

      // Create a new meeting
      const meeting = createMeeting({
        notionToken: token,
        notionDB: db,
        voiceChannel: message.member.voice.channel,
        textChannel: message.channel,
        client: message.client
      });

      await sendEmbed(message.channel, {
        title: "Tracking meeting",
        description: `View Notion database page here: https://notion.so/${meeting.notionDB}`
      });
    } else {
      // notify user that they're not in a voice channel
      await sendError(message.channel, {
        title: "Not in voice channel",
        description: "You must join a voice channel first to use this command."
      });
    }
  }
}

export default newMeeting;