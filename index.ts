import dotenv = require('dotenv');
dotenv.config();

import fs from 'fs';
import Discord from 'discord.js';
import mongoose from 'mongoose';
import express from 'express';
const app = express();

// typedefs
import { ClientWithCommands, Command, IServer } from './typedefs';

// helpers
// import { sendMessage, sendError } from './helpers/sendMessage';
import { findServer, createServer, deleteServer } from './helpers/server';

// initialize mongoose
const mongoDBString = process.env.MONGO_DB_STRING;
if (!mongoDBString) {
  console.error("Missing Mongo DB string.");
  process.exit(1);
}
mongoose.connect(mongoDBString);

// initialize Discord client
const client: ClientWithCommands = new Discord.Client();
client.commands = new Discord.Collection();
const token = process.env.DISCORD_TOKEN;

const defaultPrefix = process.env.DEFAULT_PREFIX || ".";

/**
 * Import and store array of Command objects.
 * @returns The array of commands.
 */
async function getCommands() {
  const commands: Array<Command> = [];

  // get filenames
  const commandFiles = fs.readdirSync('./dist/commands').filter(fileName => fileName.endsWith('.js'));

  // add commands to collection
  for (const fileName of commandFiles) {
    const command = await import(`./commands/${fileName}`);  // import command from each file
    commands.push(command.default);
  };

  return commands;
};

if (!token) {
  console.error("Missing Discord API token.");
  process.exit(1);
}

client.on("ready", function () {
  if (!client.user) {
    console.error("No bot user found, double-check your access token");
    process.exit(1);
  };

  console.log(`Logged in as ${client.user.tag}`);
});

client.on("guildCreate", async function (guild) {
  try {
    // get first text channel in guild
    // const channels = guild.channels.cache.array();
    // const filteredChannels = channels.filter(channel => channel.type = "text");

    // create new server entry
    await createServer({
      serverId: guild.id,
    });

    console.log(`Joined server ${guild.id}.`);
  } catch(err) {
    console.error(err);
  }
});

// client.on("guildDelete", async function (guild) {
//   try {
//     // get server in database
//     await deleteServer(guild.id);

//     console.log(`Left server ${guild.id}.`)
//   } catch(err) {
//     console.error(err);
//   }
// })

client.on("voiceStateUpdate", function (oldState, newState) {
  // console.log("Voice state updated");
  console.log(oldState);
  console.log(newState);
});

client.on("message", async function (message) {
  let prefix = defaultPrefix;
  let server: IServer | undefined;
  if (message.guild) {
    const serverId = message.guild.id;
    
    try {
      server = await findServer(serverId);
      if (!server) {
        server = await createServer({
          serverId: serverId
        });
      }
    } catch(err) {
      console.log(`Server ${serverId} already exists. No server was created.`);
    };
  
    prefix = server!.prefix;
  }

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift()  // gets the first thing in args
  if (!client.commands || !commandName) return;

  const command = client.commands.get(commandName.toLowerCase())
    || client.commands.find(cmd => cmd.aliases !== undefined && cmd.aliases.includes(commandName.toLowerCase()));

  console.log(`(message) (user ${message.author.id} in ${server ? server.id : "DMs"}) ${message.content}`);

  // if command doesn't exist, return early
  // likewise, if command is disabled by admin, return early
  // finally, if command is an admin command, return early if user doesn't have sufficient permission
  if ((server && 
    (!command ||  
    (command.type === "Admin" && message.member && !message.member.hasPermission('ADMINISTRATOR')))
  ) || (
    !server && !command?.allowDMs
  )) {
    console.log("Error: check failed. Command was not executed.");
    return;
  } 

  // retrieve the command and run execute method on it
  if (command) {
    command.execute(message, args);
  }
});

getCommands().then(commands => commands.forEach(command => client.commands?.set(command.name, command)));

client.login(token);

app.listen(5000, () => console.log("Listening on port 5000"));