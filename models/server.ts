import mongoose from 'mongoose';
import { IServer } from '../typedefs';

const Server = new mongoose.Schema({
  prefix: String,
  serverId: String,
  notionDB: String,
  notionToken: String
});

export default mongoose.model<IServer>('server', Server);