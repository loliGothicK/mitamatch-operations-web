import DiscordOauth2 from 'discord-oauth2';

export const discordOauth2 = new DiscordOauth2({
  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  clientId: process.env.DISCORD_CLIENT_ID!,
  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  clientSecret: process.env.DISCORD_CLIENT_SECRET!,
});
