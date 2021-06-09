import Discord from 'discord.js';
import axios from 'axios';
import { MeetingOptions, NotionPage, NotionDatabase } from '../typedefs';
import { sendEmbed, sendError } from './sendMessage';
import { getMonthName, getDaySuffix } from './date';

const meetings: Array<Meeting> = [];

/**
 * Represents a meeting. Tracks voice channel state, generating and updating a Notion page as needed.
 */
class Meeting {
  protected _voiceChannel: Discord.VoiceChannel | null;
  protected _messageChannel: Discord.TextChannel | Discord.DMChannel | Discord.NewsChannel;
  // protected _voiceConnection: Discord.VoiceConnection;
  protected _client: Discord.Client;
  
  protected _notionDB: string;
  protected _notionPage: NotionPage | null;
  protected _notionToken: string;

  constructor(options: MeetingOptions) {
    // Store the voice channel
    this._voiceChannel = options.voiceChannel;
    this._client = options.client;

    // Store the text channel
    this._messageChannel = options.textChannel;

    // Generate a new Notion page in the specified DB
    this._notionPage = null;
    this._notionDB = options.notionDB;
    this._notionToken = options.notionToken;

    this.initializeNotionPage();
    this.initializeVoiceEvents();
  }

  /**
   * The voice channel that the instance is tracking.
   */
  get voiceChannel() {
    return this._voiceChannel;
  }

  /**
   * The parent Notion database ID of the page.
   */
  get notionDB() {
    return this._notionDB;
  }

  /**
   * Initialize the Notion page to track data on.
   */
  async initializeNotionPage() {
    // Get today's date
    const date = new Date();
    const monthName = getMonthName(date.getMonth() + 1);
    const dayWithSuffix = `${date.getDate()}${getDaySuffix(date.getDate())}`;
    const dateStr = `${monthName} ${dayWithSuffix}`;

    try {
      // Get database information about properties
      const responseDatabase = await axios.get(`https://api.notion.com/v1/databases/${this._notionDB}`, {
        headers: {
          'Authorization': `Bearer ${this._notionToken}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2021-05-13'
        }
      });
      const dbData: NotionDatabase = responseDatabase.data;

      // conditionally construct properties object
      const properties: any = {
        'Name': {
          'title': [
            {
              'text': {
                'content': dateStr
              }
            }
          ]
        }
      };

      // iterate through members already in VC
      const names = this._voiceChannel?.members.array().map(member => member.displayName);
      names?.forEach(name => {
        if (Object.keys(dbData.properties).includes(name)) {
          properties[name] = {
            'checkbox': true
          }
        }
      })
      
      // Create the page
      const response = await axios.post('https://api.notion.com/v1/pages', {
        'parent': {
          'database_id': this._notionDB
        },
        'properties': properties
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Notion-Version': '2021-05-13',
          'Authorization': `Bearer ${this._notionToken}`
        }
      });

      const data: NotionPage = response.data;

      // Store page data in variable
      this._notionPage = data;
    } catch(err) {
      console.error(err);
    }
  }

/**
 * Update the property value of the Notion page.
 * @param property Name of the property to update.
 * @param value What to set the property to.
 */
  async updateNotionPage(property: string, value: boolean) {
    try {
      // if (!this._notionPage) {
      //   throw new Error("Notion page doesn't exist.");
      // }

      const properties: any = {};

      properties[property] = {
        'checkbox': value
      };;

      const response = await axios.patch(`https://api.notion.com/v1/pages/${this._notionPage!.id}`, {
        'properties': properties
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Notion-Version': '2021-05-13',
          'Authorization': `Bearer ${this._notionToken}`
        }
      });

      const data: NotionPage = response.data;
      this._notionPage = data;
    } catch(err) {
      if (err.response && err.response.status === 404) {
        try {
          await sendError(this._messageChannel, {
            title: "Notion page deleted",
            description: "The Notion page tracking the meeting was deleted. Start a new meeting with `new` to begin tracking updates."
          });

          this.deregister();
        } catch(err) {
          console.error(err);
        }
      }
    }
  }

  /**
   * Listen to voice state events for changes.
   */
  initializeVoiceEvents() {
    this._client.on('voiceStateUpdate', (oldState, newState) => {
      // Check if join or leave
      if ((
        this._voiceChannel &&
        !oldState.channelID && 
        newState.channelID && 
        newState.channelID === this._voiceChannel.id
      ) || (
        this._voiceChannel &&
        oldState.channelID &&
        newState.channelID &&
        newState.channelID === this._voiceChannel.id
      )) {
        // someone joined
        console.log(`${newState.member?.displayName} joined VC ${newState.channelID}`)
        
        // call Notion API to update database

        // check if user's display name is in page properties
        if (
          this._notionPage && 
          newState.member?.displayName &&
          Object.keys(this._notionPage.properties).includes(newState.member?.displayName)
        ) {
          // update page
          this.updateNotionPage(newState.member.displayName, true);
        }

      } else if ((
        this._voiceChannel &&
        oldState.channelID &&
        oldState.channelID === this._voiceChannel.id &&
        !newState.channelID
      ) || (
        this._voiceChannel &&
        oldState.channelID && 
        newState.channelID && 
        newState.channelID !== this._voiceChannel.id
      )) {
        // someone left
        console.log(`${newState.member?.displayName} left VC ${oldState.channelID}`);

        // if no more members, stop tracking meeting
        if (oldState.channel?.members.array().length === 0) {
          sendEmbed(this._messageChannel, {
            title: "Meeting ended",
            description: "Run `new` to start tracking a new meeting."
          })
            .catch(err => {
              console.error(err);
            })

          this.deregister();
        }
      };
    }
  )};

  /**
   * Stop tracking the voice channel and the Notion page.
   */
  deregister() {
    this._voiceChannel = null;
    this._notionPage = null;
  }
}

function createMeeting(options: MeetingOptions) {
  const meeting = new Meeting(options);
  meetings.push(meeting);

  return meeting;
};

function getMeetings() {
  return meetings;
}

function deleteMeeting(channelID: string) {
  const index = meetings.findIndex(meeting => meeting.voiceChannel?.id === channelID);

  if (index !== -1) {
    meetings.slice(index, 1);
  } else {
    console.error("Meeting doesn't exist in array.");
  }
}

export { Meeting, createMeeting, getMeetings, deleteMeeting };