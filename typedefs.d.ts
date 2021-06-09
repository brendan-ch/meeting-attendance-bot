import mongoose from 'mongoose';
import Discord from 'discord.js';

/**
 * Hack to allow storing commands in Discord client.
 */
interface ClientWithCommands extends Discord.Client {
  commands?: Discord.Collection<string, Command>
};

/**
 * Hack that uses new `ClientWithCommands` property in Discord message.
 */
interface MessageWithCommands extends Discord.Message {
  client: ClientWithCommands
};

/**
 * Represents a command object. 
 * Contains command information (name, aliases) as well as a method that runs
 * when the command is called.
 */
interface Command {
  /**
   * The name of the command. `execute` property is run when command name is called.
   */
  name: string,
  /**
   * Alternative ways the user can call the command.
   */
  aliases?: Array<string>,
  /**
   * Description of the command. Shown in help command.
   */
  description: string,
  /**
   * Whether or not the command can be used in DMs.
   */
  allowDMs: boolean,
  /**
   * Section that the command belongs to. Shows up in help command.
   * If type is "Admin", command can only be run when user has admin role on server.
   */
  type: "General" | "Admin",
  /**
   * Describes how to use the command. Shown in help command.
   */
  usage?: string,
  /**
   * Method that is run when command is called.
   * @param message 
   * @param args 
   */
  execute(message: MessageWithCommands, args: Array<string>): Promise<void>,
};

/**
 * Represents a Discord server instance in the database.
 */
interface IServer extends mongoose.Document {
  prefix: string,
  serverId: string,
  notionDB?: string | null,
  notionToken?: string | null
};

/**
 * Used when creating or updating a server.
 */
interface ServerOptions {
  prefix?: string,
  serverId: string,
  notionDB?: string | null,
  notionToken?: string | null
}

/**
 * Passed when creating a new Meeting class instance.
 */
interface MeetingOptions {
  /**
   * Notion API token.
   */
  notionToken: string,
  /**
   * Database ID to create the new page in.
   */
  notionDB: string,
  /**
   * The voice channel to be tracked.
   */
  voiceChannel: Discord.VoiceChannel,
  /**
   * Bot client that is created on bot startup.
   */
  client: Discord.Client,
  /**
   * Text channel to send messages to.
   */
  textChannel: Discord.TextChannel | Discord.DMChannel | Discord.NewsChannel
}

interface NotionPage {
  object: string,
  id: string,
  created_time: string,
  last_edited_time: string,
  parent: {
    type: string,
    database_id: string
  },
  archived: boolean,
  properties: any
}

interface NotionDatabase extends NotionPage {
  title: Array<any>
}

export { 
  ClientWithCommands, 
  MessageWithCommands, 
  Command, 
  IServer, 
  ServerOptions,
  MeetingOptions,
  NotionPage,
  NotionDatabase
}