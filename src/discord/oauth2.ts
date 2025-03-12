import DiscordOauth2 from 'discord-oauth2';

export const discordOauth2 = new DiscordOauth2({
  clientId: process.env.DISCORD_CLIENT_ID!,
  clientSecret: process.env.DISCORD_CLIENT_SECRET!,
});
