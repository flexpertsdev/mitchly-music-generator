import { Client, Account, Databases, Functions, Query, ID } from 'appwrite';

const client = new Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1') // Your API Endpoint from the screenshot
    .setProject('mitchly-music'); // Your project ID

export const account = new Account(client);
export const databases = new Databases(client);
export const functions = new Functions(client);
export { Query, ID };

// OAuth provider enum
export const OAuthProvider = {
    Spotify: 'spotify'
};