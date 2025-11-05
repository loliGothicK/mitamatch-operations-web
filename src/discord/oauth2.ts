import DiscordOauth2 from "discord-oauth2";

export const discordOauth2 = new DiscordOauth2({
  // biome-ignore lint/style/noNonNullAssertion: should be set in env
  clientId: process.env.DISCORD_CLIENT_ID!,
  // biome-ignore lint/style/noNonNullAssertion: should be set in env
  clientSecret: process.env.DISCORD_CLIENT_SECRET!,
});
