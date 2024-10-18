<template>
  <div class="h-screen flex items-center">
    <div class="mx-auto text-center">
      <img
        src="/digitalhomes.svg"
        alt="Digital Homes logo"
        class="w-60 mx-auto mb-8"
      />
      <h2 class="mb-4 text-xl font-semibold">{{ title }}</h2>
      <p class="mb-8 text-[#66708e]">
        {{ description }}
        <span v-if="codeFound">Redirecting in {{ countdown }}...</span>
      </p>
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

<script setup lang="ts">
import { ref, onMounted } from "vue";
import axios from "axios";

// Variables for text display
const title = ref("Connect Your Google Calendar");
const description = ref(
  "Click the button below to authorize access to your Google Calendar."
);
const buttonText = ref("Connect");

// Add your Google OAuth credentials here
const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
const redirectUri = `https://digital-homes-booking.netlify.app/authenticate`;
const accessToken = ref("");
const refreshToken = ref("");
const codeFound = ref(false);
const countdown = ref(5); // Initialize countdown to 5 seconds

// Function to extract tokens from the URL after Google redirects back
const extractTokenFromUrl = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const authorizationCode = urlParams.get("code");

  if (authorizationCode) {
    // Exchange the authorization code for access and refresh tokens
    codeFound.value = true;
    exchangeCodeForTokens(authorizationCode);
  } else {
    console.log("No Authorization Code found in URL");
  }
};

// Function to exchange the authorization code for access and refresh tokens
const exchangeCodeForTokens = async (authorizationCode) => {
  try {
    const response = await axios.post("https://oauth2.googleapis.com/token", {
      code: authorizationCode,
      client_id: clientId,
      client_secret: import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    // Make sure to set the tokens correctly
    accessToken.value = response.data.access_token || "";
    refreshToken.value = response.data.refresh_token || "";

    // Fetch the user's email and then store the tokens and email in Airtable
    fetchUserEmail(accessToken.value);
    title.value = "Google Calendar Connected";
    description.value = "You have successfully connected your Google Calendar.";
    startCountdown();
  } catch (error) {
    console.error("Error exchanging code for tokens:", error);
  }
};

const startCountdown = () => {
  const countdownInterval = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value -= 1;
    } else {
      clearInterval(countdownInterval);
      goBackToApp(); // Redirect when countdown reaches 0
    }
  }, 1000); // Decrease countdown every second
};

// Function to fetch the user's email using the Google UserInfo API
const fetchUserEmail = async (accessTokenVal) => {
  try {
    const response = await axios.get(
      "https://www.googleapis.com/oauth2/v1/userinfo?alt=json",
      {
        headers: {
          Authorization: `Bearer ${accessTokenVal}`,
        },
      }
    );

    const userEmail = response.data.email;

    // Ensure the tokens are valid before storing them in Airtable
    if (accessToken.value && refreshToken.value) {
      // Call the function to store tokens in Airtable
      storeTokensInAirtable(
        userEmail, // The user's email
        accessToken.value, // Access token
        refreshToken.value // Refresh token
      );
    } else {
      console.error("Tokens are missing or undefined");
    }
  } catch (error) {
    console.error("Error fetching user email:", error);
  }
};

// Function to store tokens and email in Airtable
const storeTokensInAirtable = async (email, accessToken, refreshToken) => {
  const airtableBaseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
  const airtableTableName = import.meta.env.VITE_ACCESS_TOKEN_TABLE_ID; // calendar data table
  const airtableToken = import.meta.env.VITE_AIRTABLE_TOKEN;

  try {
    const response = await axios.post(
      `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`,
      {
        fields: {
          Email: email,
          ["Access Token"]: accessToken, // Ensure tokens are sent
          ["Refresh Token"]: refreshToken, // Ensure tokens are sent
        },
      },
      {
        headers: {
          Authorization: `Bearer ${airtableToken}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error saving tokens to Airtable:", error);
  }
};

// OAuth login flow function
const connectGoogleCalendar = () => {
  const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email&access_type=offline&include_granted_scopes=true&prompt=consent`;
  window.location.href = oauthUrl;
};

const goBackToApp = () => {
  window.location.href = "/";
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
