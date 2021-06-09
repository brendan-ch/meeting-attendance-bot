import { findServer, createServer } from '../helpers/server';
import { sendEmbed, sendError } from '../helpers/sendMessage';
import { Command } from '../typedefs';

// const validPrefixes = ['.', ',', '!', '?', '/', '<', '>', ';', '~'];
const validPrefixes = '.,!?/<>;~';

/**
 * Change the prefix of the server.
 */
const prefixCommand: Command = {
  name: 'prefix',
  description: 'List the prefix for this server, or change the prefix for this server if one is specified.',
  type: "Admin",
  allowDMs: false,
  usage: '<new prefix (optional)>',
  execute: async function(message, args) {
    const serverId = message.guild!.id;
    let server = await findServer(serverId);
    if (!server) {
      server = await createServer({
        serverId
      });
    }

    // return current prefix
    if (args.length === 0) {
      const hasAdmin = message.member!.hasPermission('ADMINISTRATOR');

      await sendEmbed(message.channel, {
        title: "Server prefix",
        description: "The current server prefix is `" + server.prefix + "`." + 
          (hasAdmin ? 
            " Available prefixes include: `" + validPrefixes + "`."
          :
            ""
          ),
      });

      return;
    }

    // check for sufficient permissions
    else if (!message.member!.hasPermission('ADMINISTRATOR')) {
      await sendError(message.channel, {
        title: "Insufficient permissions",
        description: 'You must have a role with the "Administrator" permission enabled to change the server prefix.',
      });

      return;
    }

    // check whether prefix is valid
    else if (!validPrefixes.includes(args[0]) || args[0].length > 1) {
      await sendError(message.channel, {
        title: "Error setting new prefix",
        description: "Invalid prefix provided. Available prefixes include: `" + validPrefixes + "`.",
        color: "#ff0000"
      })

      return;
    };

    server.prefix = args[0]  // set new prefix
    server.save();

    await sendEmbed(message.channel, {
      title: "Prefix set!",
      description: "The prefix for this server is now `" + server.prefix + "`.",
      color: "#08FF00"
    });

    return;
  }
}

export default prefixCommand;