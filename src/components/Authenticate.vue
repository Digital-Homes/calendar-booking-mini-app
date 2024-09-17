<template>
  <div class="h-screen flex items-center">
    <div class="mx-auto text-center">
      <img
        src="/digitalhomes.svg"
        alt="Digital Homes logo"
        class="w-60 mx-auto mb-8"
      />
      <h2 class="mb-4 text-xl font-semibold">
        {{ confirmationText }}
      </h2>
      <p class="mb-8 text-[#66708e]">
        {{ confirmationSubText }}
      </p>
      <button
        @click="redirectToApp"
        class="py-3 px-9 bg-[#eb36c5] text-white rounded-full font-semibold"
      >
        {{ buttonText }}
      </button>
    </div>
  </div>
</template>

<template>
  <div class="h-screen flex items-center">
    <div class="mx-auto text-center">
      <img
        src="/digitalhomes.svg"
        alt="Digital Homes logo"
        class="w-60 mx-auto mb-8"
      />
      <h2 class="mb-4 text-xl font-semibold">{{ title }}</h2>
      <p class="mb-8 text-[#66708e]">{{ description }}</p>
      <button
        v-if="!codeFound"
        @click="connectGoogleCalendar"
        class="py-3 px-9 bg-[#eb36c5] text-white rounded-full font-semibold"
      >
        {{ buttonText }}
      </button>
      <button
        v-else
        @click="goBackToApp"
        class="py-3 px-9 bg-[#eb36c5] text-white rounded-full font-semibold"
      >
        Go Back to App
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

// Variables for text display
const title = ref('Connect Your Google Calendar');
const description = ref('Click the button below to authorize access to your Google Calendar.');
const buttonText = ref('Connect');

// Add your Google OAuth credentials here
const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
const redirectUri = 'https://digital-homes-booking.netlify.app/authenticate'; // Must match what's in Google Developer Console as an 'Authorized redirect URI'
const accessToken = ref('');
const refreshToken = ref('');
const codeFound = ref(false);

console.log('Google OAuth Client ID:', clientId);
console.log('Redirect URI:', redirectUri);

// Function to extract tokens from the URL after Google redirects back
const extractTokenFromUrl = () => {
  console.log('extractTokenFromUrl called');
  const urlParams = new URLSearchParams(window.location.search);
  const authorizationCode = urlParams.get('code');
  console.log('Full URL Params:', window.location.href);
  console.log('Authorization Code:', authorizationCode);

  if (authorizationCode) {
    console.log('Authorization Code exists, calling exchangeCodeForTokens');
    codeFound.value = true; // This flag will hide the "Connect" button and show the confirmation
    exchangeCodeForTokens(authorizationCode);
  } else {
    console.log('No Authorization Code found in URL');
  }
};

// Function to exchange the authorization code for access and refresh tokens
const exchangeCodeForTokens = async (authorizationCode) => {
  console.log('exchangeCodeForTokens called with code:', authorizationCode);

  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      code: authorizationCode,
      client_id: clientId,
      client_secret: import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    console.log('Response from Google Token Exchange:', response.data);

    // Make sure to set the tokens correctly
    accessToken.value = response.data.access_token || '';
    refreshToken.value = response.data.refresh_token || '';

    console.log('Access Token:', accessToken.value);
    console.log('Refresh Token:', refreshToken.value);

    // Fetch the user's email and then store the tokens and email in Airtable
    fetchUserEmail(accessToken.value);

    // Change the text after a successful exchange
    title.value = 'Google Calendar Connected';
    description.value = 'You have successfully connected your Google Calendar.';
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
  }
};

// Function to fetch the user's email using the Google UserInfo API
const fetchUserEmail = async (accessTokenVal) => {
  console.log('fetchUserEmail called with AccessToken:', accessTokenVal);

  try {
    const response = await axios.get(
      'https://www.googleapis.com/oauth2/v1/userinfo?alt=json',
      {
        headers: {
          Authorization: `Bearer ${accessTokenVal}`,
        },
      }
    );

    console.log('Response from Google UserInfo API:', response.data);

    const userEmail = response.data.email;
    console.log('User Email:', userEmail);

    // Ensure the tokens are valid before storing them in Airtable
    if (accessToken.value && refreshToken.value) {
      console.log('Tokens are valid, storing in Airtable...');
      // Call the function to store tokens in Airtable
      storeTokensInAirtable(
        userEmail, // The user's email
        accessToken.value, // Access token
        refreshToken.value // Refresh token
      );
    } else {
      console.error('Tokens are missing or undefined');
    }
  } catch (error) {
    console.error('Error fetching user email:', error);
  }
};

// Function to store tokens and email in Airtable
const storeTokensInAirtable = async (email, accessToken, refreshToken) => {
  console.log('storeTokensInAirtable called with:', {
    email,
    accessToken,
    refreshToken,
  });

  const airtableBaseId = 'appnlATCpTLD0eA42';
  const airtableTableName = 'Calendar Data';
  const airtableToken =
    'patqQ7CqYQ7x5cAFZ.78dd41590a05303b075c28b56ddd817e2d7470cb2825cd87e6f0b0bfff1e0e53';

  console.log('Airtable base ID:', airtableBaseId);
  console.log('Airtable table name:', airtableTableName);

  try {
    const response = await axios.post(
      `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`,
      {
        fields: {
          Email: email,
          AccessToken: accessToken, // Ensure tokens are sent
          RefreshToken: refreshToken, // Ensure tokens are sent
        },
      },
      {
        headers: {
          Authorization: `Bearer ${airtableToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('Tokens and email saved to Airtable:', response.data);
  } catch (error) {
    console.error('Error saving tokens to Airtable:', error);
  }
};

// OAuth login flow function
const connectGoogleCalendar = () => {
  console.log('connectGoogleCalendar called');
  const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email&access_type=offline&include_granted_scopes=true`;
  console.log('OAuth URL:', oauthUrl);
  window.location.href = oauthUrl;
};

// Function to redirect back to the app
const goBackToApp = () => {
  window.location.href = '/';
};

// Run when the component is mounted
onMounted(() => {
  console.log('Component mounted, calling extractTokenFromUrl');
  extractTokenFromUrl();
});
</script>