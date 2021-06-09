import Discord from 'discord.js';

import Server from '../models/server';
import { ServerOptions } from '../typedefs';
const defaultPrefix = process.env.DEFAULT_PREFIX;

/**
 * Find server/guild by server ID.
 * @param serverId The ID of the server/guild.
 * @returns The server, or `undefined` if no server found.
 */
async function findServer(serverId: string) {
  try {
    // returns null if no server
    const server = await Server.findOne({
      serverId: serverId
    }).exec();

    if (server) {
      await server.save();
      return server;
    } else {  // no server was found
      return undefined;
    };
  } catch(err) {
    console.error(err);

    throw new Error(err);
  }
};

/**
 * Create a new server/guild in the database.
 * @param serverOptions
 * @returns The newly created server.
 */
async function createServer(serverOptions: ServerOptions) {
  try {
    // check if server exists here
    const oldServer = await findServer(serverOptions.serverId);
    if (oldServer) throw new Error("Server already exists.");

    const server = new Server({
      prefix: serverOptions.prefix || defaultPrefix || ".",
      serverId: serverOptions.serverId
    });
    const error = server.validateSync();
    if (error) throw new Error(error.message);

    server.save();

    return server;
  } catch(err) {
    console.error(err);

    // reject promise
    throw new Error(err);
  }
};

/**
 * Update a server/guild in the database.
 * @param serverOptions Options to update the server with.
 * @returns The newly updated server.
 */
async function updateServer(serverOptions: ServerOptions) {
  try {
    let server = await findServer(serverOptions.serverId);
    if (!server) throw new Error("Server doesn't exist.");

    server.prefix = serverOptions.prefix || server.prefix;

    if (serverOptions.notionDB === null) {
      server.notionDB = undefined;
    } else {
      server.notionDB = serverOptions.notionDB || server.notionDB;
    }

    if (serverOptions.notionToken === null) {
      server.notionToken = undefined;
    } else {
      server.notionToken = serverOptions.notionToken || server.notionToken;
    }
    
    

    await server.save();
    return server;
  } catch(err) {
    console.error(err);

    // reject promise
    throw new Error(err);
  }
}

/**
 * Delete a server/guild from the database.
 * @param serverId The server/guild ID to delete.
 */
async function deleteServer(serverId: string) {
  try {
    const server = await findServer(serverId);
    
    if (server) {
      server.delete();

      return;
    } else {
      throw new Error("Server doesn't exist.");
    }
  } catch(err) {
    console.error(err);

    // reject promise
    throw new Error(err);
  }
}

export { findServer, createServer, updateServer, deleteServer };