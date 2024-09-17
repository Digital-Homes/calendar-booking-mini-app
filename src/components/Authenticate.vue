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

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

// Add your Google OAuth credentials here
const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
const redirectUri = 'https://digital-homes-booking.netlify.app/authenticate'; // Ensure this matches Google Developer Console
const accessToken = ref('');
const refreshToken = ref('');
const confirmationText = ref('Connect Your Google Calendar');
const confirmationSubText = ref('Click the button below to authorize access to your Google Calendar.');
const buttonText = ref('Connect');

// Function to update UI on successful OAuth process
const updateSuccessUI = () => {
  confirmationText.value = 'Google Calendar Connected!';
  confirmationSubText.value = 'Your Google Calendar was successfully connected.';
  buttonText.value = 'Go Back to App';
};

// Function to handle redirect to the main app
const redirectToApp = () => {
  if (confirmationText.value === 'Google Calendar Connected!') {
    window.location.href = '/'; // Change this to the homepage or app URL
  } else {
    connectGoogleCalendar();
  }
};

// Function to extract tokens from the URL after Google redirects back
const extractTokenFromUrl = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const authorizationCode = urlParams.get('code');

  if (authorizationCode) {
    exchangeCodeForTokens(authorizationCode);
  } else {
    console.log('No Authorization Code found in URL');
  }
};

// Function to exchange the authorization code for access and refresh tokens
const exchangeCodeForTokens = async (authorizationCode) => {
  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      code: authorizationCode,
      client_id: clientId,
      client_secret: import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    // Set the tokens
    accessToken.value = response.data.access_token || '';
    refreshToken.value = response.data.refresh_token || '';

    // Fetch the user's email and store tokens in Airtable
    fetchUserEmail(accessToken.value);
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
  }
};

// Function to fetch the user's email using the Google UserInfo API
const fetchUserEmail = async (accessTokenVal) => {
  try {
    const response = await axios.get(
      'https://www.googleapis.com/oauth2/v1/userinfo?alt=json',
      {
        headers: {
          Authorization: `Bearer ${accessTokenVal}`,
        },
      }
    );

    const userEmail = response.data.email;

    if (accessToken.value && refreshToken.value) {
      storeTokensInAirtable(userEmail, accessToken.value, refreshToken.value);
    } else {
      console.error('Tokens are missing or undefined');
    }
  } catch (error) {
    console.error('Error fetching user email:', error);
  }
};

// Function to store tokens and email in Airtable
const storeTokensInAirtable = async (email, accessToken, refreshToken) => {
  const airtableBaseId = 'appnlATCpTLD0eA42';
  const airtableTableName = 'Calendar Data';
  const airtableToken =
    'patqQ7CqYQ7x5cAFZ.78dd41590a05303b075c28b56ddd817e2d7470cb2825cd87e6f0b0bfff1e0e53';

  try {
    await axios.post(
      `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`,
      {
        fields: {
          Email: email,
          AccessToken: accessToken,
          RefreshToken: refreshToken,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${airtableToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // After storing tokens, update the UI
    updateSuccessUI();
  } catch (error) {
    console.error('Error saving tokens to Airtable:', error);
  }
};

// OAuth login flow function
const connectGoogleCalendar = () => {
  const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email&access_type=offline&include_granted_scopes=true`;
  window.location.href = oauthUrl;
};

// Run when the component is mounted
onMounted(() => {
  extractTokenFromUrl();
});
</script>
