import { findServer, createServer, updateServer } from '../helpers/server';
import { sendEmbed, sendError } from '../helpers/sendMessage';
import { Command, IServer } from '../typedefs';

/**
 * Set Notion credentials for the server.
 */
const notion: Command = {
  name: "notion",
  description: "Set Notion API token and database ID values.",
  allowDMs: true,
  type: "General",
  execute: async function(message, args) {
    let server: IServer | undefined = undefined;

    try {
      if (!message.guild) {
        // check for third argument (server ID)
        if (!args[2]) {
          await sendError(message.channel, {
            title: "Server ID not specified",
            description: "You must specify a server to set the value to (if setting value using DM)."
          });
          return;
        };
  
        server = await findServer(args[2]);
        if (!server) {
          await sendError(message.channel, {
            title: "Server doesn't exist",
            description: "Unable to find server."
          });
          return;
        }
  
        const guild = await message.client.guilds.fetch(args[2]);
        const member = await guild.members.fetch(message.author);
        if (!member) {
          await sendError(message.channel, {
            title: "Not a member",
            description: "You are not a member of the specified server."
          });
          return;
        };
  
        if (!member.hasPermission(['ADMINISTRATOR'])) {
          return;
        };
      } else {
        // Get Notion token and database ID from database
        server = await findServer(message.guild.id);
        if (!server) {
          server = await createServer({ serverId: message.guild.id });
        };

        if (!message.member?.hasPermission(['ADMINISTRATOR'])) {
          return;
        }
      }
  
      if (args[1] || args[0] === "reset") {
        switch (args[0]) {
          case "token":
            await updateServer({
              serverId: server.serverId,
              notionToken: args[1]
            });

            await sendEmbed(message.channel, {
              title: "Notion token set",
              description: "Notion token has been set."
            });

            return;
          case "database":
            await updateServer({
              serverId: server.serverId,
              notionDB: args[1]
            });

            await sendEmbed(message.channel, {
              title: "Notion database ID set",
              description: "Notion database ID has been set."
            });
            return;
          case "reset":
            await updateServer({
              serverId: server.serverId,
              notionDB: null,
              notionToken: null
            });

            await sendEmbed(message.channel, {
              title: "Notion credentials reset",
              description: "Notion token and database ID have been reset."
            });
            return;
          default: 
            await sendError(message.channel, {
              title: "Invalid first argument",
              description: "First argument should be `token` or `database`."
            });
        }
      } else {
        await sendError(message.channel, {
          title: "Invalid second argument",
          description: "Second argument shouldn't be empty."
        });
      }
    } catch(err) {
      console.error(err);
    }
    
    
  }
}

export default notion;