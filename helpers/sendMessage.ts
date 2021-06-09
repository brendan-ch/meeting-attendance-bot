import Discord from 'discord.js';

/**
 * Default color set in environment variables.
 */
const defaultColor = process.env.DEFAULT_COLOR_CODE ? `#${process.env.DEFAULT_COLOR_CODE}` : "#ffffff";

/**
 * Send a Discord embed in the specified channel.
 * @param channel 
 * @param embedOptions 
 */
async function sendEmbed(
  channel: Discord.TextChannel | Discord.NewsChannel | Discord.DMChannel, 
  embedOptions: Discord.MessageEmbedOptions) 
{
  try {
    const embed = new Discord.MessageEmbed({
      ...embedOptions,
      color: embedOptions.color || defaultColor
    });

    await channel.send(embed);
  } catch(err) {
    console.error(err);
  }
};

/**
 * Send an error message in the specified channel.
 * @param channel 
 * @param embedOptions 
 */
async function sendError(
  channel: Discord.TextChannel | Discord.NewsChannel | Discord.DMChannel,
  embedOptions: Discord.MessageEmbedOptions
) {
  try {
    const embed = new Discord.MessageEmbed({
      ...embedOptions,
      title: embedOptions.title || "An error occurred",
      color: embedOptions.color || "#ff0000"
    });

    await channel.send(embed);
  } catch(err) {
    console.error(err);
  }
};

export { sendEmbed, sendError };