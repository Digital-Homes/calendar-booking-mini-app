<template>
    <div class="h-screen flex items-center">
      <div class="mx-auto text-center">
        <img
          src="/digitalhomes.svg"
          alt="Digital Homes logo"
          class="w-60 mx-auto mb-8"
        />
        <h2 class="mb-4 text-xl font-semibold">Connect Your Google Calendar</h2>
        <p class="mb-8 text-[#66708e]">
          Click the button below to authorize access to your Google Calendar.
        </p>
        <button
          @click="connectGoogleCalendar"
          class="py-3 px-9 bg-[#eb36c5] text-white rounded-full font-semibold"
        >
          Connect
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import axios from 'axios';
  
  // Add your Google OAuth credentials here
  const clientId =
    '200822425571-mfp431gnt4emg4007g507pf139vig9ie.apps.googleusercontent.com';
  const redirectUri = `${window.location.origin}/connect-google-calendar`;
  const accessToken = ref('');
  const refreshToken = ref('');
  
  // Function to extract tokens from the URL after Google redirects back
  const extractTokenFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const authorizationCode = urlParams.get('code');
  
    if (authorizationCode) {
      console.log('Authorization Code:', authorizationCode);
      // Exchange the authorization code for access and refresh tokens
      exchangeCodeForTokens(authorizationCode);
    }
  };
  
  // Function to exchange the authorization code for access and refresh tokens
  const exchangeCodeForTokens = async (authorizationCode) => {
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        code: authorizationCode,
        client_id: clientId,
        client_secret: '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',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });
  
      // Make sure to set the tokens correctly
      accessToken.value = response.data.access_token || '';
      refreshToken.value = response.data.refresh_token || '';
  
      console.log('Access Token:', accessToken.value);
      console.log('Refresh Token:', refreshToken.value);
  
      // Fetch the user's email and then store the tokens and email in Airtable
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
      console.log('User Email:', userEmail);
  
      // Ensure the tokens are valid before storing them in Airtable
      if (accessToken.value && refreshToken.value) {
        console.log('Storing tokens in Airtable...');
  
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
    const airtableBaseId = 'appnlATCpTLD0eA42';
    const airtableTableName = 'Calendar Data';
    const airtableToken =
      'patqQ7CqYQ7x5cAFZ.78dd41590a05303b075c28b56ddd817e2d7470cb2825cd87e6f0b0bfff1e0e53';
  
    console.log('Sending to Airtable:', { email, accessToken, refreshToken });
  
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
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email&access_type=offline&include_granted_scopes=true`;
    window.location.href = oauthUrl;
  };
  
  // Run when the component is mounted
  onMounted(() => {
    extractTokenFromUrl();
  });
  </script>
  
  <style scoped>
  .btn {
    background-color: #1a73e8;
    color: white;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
  }
  .btn:hover {
    background-color: #0f62da;
  }
  </style>
  