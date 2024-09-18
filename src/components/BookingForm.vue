<template>
  <div class="mx-auto my-16 max-w-[768px]">
    <img
      src="/digitalhomes.svg"
      alt="Digital Homes logo"
      class="w-60 mx-auto mb-8"
    />
    <FormKit type="form" @submit="submit">
      <FormKit type="multi-step" ref="multiStep" :allow-incomplete="false">
        <!-- Step 1: Choose Photographer -->
        <FormKit
          type="step"
          name="Choose Photographer"
          title="Choose Photographer"
        >
          <FormKit
            type="radio"
            v-model="bookingData.selectedPhotographer"
            label="Choose Photographer"
            :options="photographerOptions"
            :classes="{
              outer: 'mb-8',
              wrapper: 'py-2 px-4 w-full cursor-pointer',
              option:
                'flex text-black border-2 border-gray-200 rounded hover:border-gray-800',
              decorator: 'hidden',
              messages: 'mt-4',
            }"
            validation="required"
            :validation-messages="{
              required: 'Please choose a photographer to continue',
            }"
          >
            <template #label="context">
              <div class="flex items-center cursor-pointer">
                <div class="text-gray-800 text-sm underline">
                  {{ context.option.email }}
                </div>
              </div>
            </template>
          </FormKit>
        </FormKit>

        <!-- Step 2: Choose Time -->
        <FormKit type="step" name="Choose Time" title="Choose Time">
          <div v-if="loading" class="text-center py-8">
            <div class="spinner"></div>
            <!-- Loader while fetching -->
            <p>Loading availability...</p>
          </div>

          <div v-else class="flex gap-8 mb-8">
            <!-- Date Selection -->
            <div class="w-1/2">
              <div class="grid grid-cols-5 gap-1.5">
                <div
                  v-for="(slot, index) in dateSlots"
                  :key="index"
                  :class="[
                    'border-2 border-gray-200 hover:border-gray-800 text-sm rounded p-2 text-center leading-none cursor-pointer',
                    {
                      'border-gray-800':
                        selectedSlot && selectedSlot.date === slot.date,
                    },
                  ]"
                  @click="selectDate(slot)"
                >
                  <div class="mb-2 text-gray-600">
                    {{ moment(slot.date).format('ddd') }}
                  </div>
                  <div class="-mb-0.5 font-bold uppercase">
                    {{ moment(slot.date).format('MMM') }}
                  </div>
                  <div class="text-lg font-bold">
                    {{ moment(slot.date).format('DD') }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Time Selection -->
            <div class="w-1/2">
              <div v-if="selectedSlot" class="space-y-2">
                <button
                  v-for="timeSlot in selectedSlot.times"
                  :key="timeSlot.time"
                  :disabled="!timeSlot.available"
                  :class="[
                    'block w-full border rounded p-2',
                    timeSlot.available
                      ? 'border-2 border-gray-200 cursor-pointer'
                      : 'border-2 border-gray-200 bg-gray-200 text-gray-500 cursor-not-allowed opacity-50',
                    {
                      'border-gray-800':
                        bookingData.selectedTime === timeSlot.time,
                    },
                  ]"
                  type="button"
                  @click="timeSlot.available && selectTime(timeSlot)"
                >
                  {{ timeSlot.time }}
                </button>
              </div>
              <div
                v-else
                class="h-full flex items-center justify-center text-sm opacity-50"
              >
                <p>Please select a date first.</p>
              </div>
            </div>
          </div>
          <!-- Next button should trigger form submission -->
          <template #stepNext>
            <FormKit type="submit" label="Submit" />
          </template>
        </FormKit>
      </FormKit>
    </FormKit>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';
import moment from 'moment-timezone';

const airtableBaseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
const airtableTableName = import.meta.env.VITE_AIRTABLE_TABLE_NAME;
const airtableToken = import.meta.env.VITE_AIRTABLE_TOKEN;

const airtableData = ref([]);
const photographerOptions = ref([]);
const bookingData = ref({
  selectedPhotographer: null,
  selectedTime: null,
  selectedDate: null,
});
const selectedSlot = ref(null);
const dateSlots = ref([]);
const loading = ref(false);

// Fetch Data from Airtable and create photographer options based on the Email column
const fetchDataFromAirtable = async () => {
  try {
    const response = await axios.get(
      `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`,
      {
        headers: {
          Authorization: `Bearer ${airtableToken}`,
        },
      }
    );
    airtableData.value = response.data.records;

    // Map the data to create photographer options using the Email field
    const uniquePhotographers = new Set();
    photographerOptions.value = airtableData.value
      .filter((photographer) => {
        const email = photographer.fields.Email;
        const isDuplicate = uniquePhotographers.has(email);
        uniquePhotographers.add(email);
        return !isDuplicate;
      })
      .map((photographer) => ({
        value: photographer.fields.Email,
        email: photographer.fields.Email,
      }));
  } catch (error) {
    console.error('Error fetching data from Airtable:', error);
  }
};

onMounted(fetchDataFromAirtable);

// Fetch Google Calendar events based on the selected photographer's email
const fetchGoogleCalendarEvents = async (email) => {
  if (!email) return;

  console.log(`Fetching calendar events for: ${email}`);

  // Show loader
  loading.value = true;

  // Get the access and refresh tokens from Airtable
  const photographer = airtableData.value.find(
    (item) => item.fields.Email === email
  );

  const accessToken = photographer.fields.AccessToken;
  const refreshToken = photographer.fields.RefreshToken;

  try {
    // Fetch events from Google Calendar
    const response = await axios.get(
      `https://www.googleapis.com/calendar/v3/calendars/${email}/events`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const events = response.data.items;
    console.log('Events from Google Calendar:', events);

    // Generate date slots and mark unavailable times
    resetDateSlots();
    dateSlots.value.forEach((slot) => {
      slot.times.forEach((timeSlot) => {
        events.forEach((event) => {
          // Handle all-day events using the 'date' field
          const eventStart = event.start.dateTime
            ? moment(event.start.dateTime)
            : moment(event.start.date, 'YYYY-MM-DD').startOf('day');
          const eventEnd = event.end.dateTime
            ? moment(event.end.dateTime)
            : moment(event.end.date, 'YYYY-MM-DD').endOf('day');

          const slotDateTime = convertToDateTime(slot.date, timeSlot.time);

          // Block the timeslot if it falls within the event's start and end times
          if (slotDateTime.isBetween(eventStart, eventEnd, 'minute', '[]')) {
            timeSlot.available = false;
          }
        });
      });
    });

    loading.value = false; // Hide loader
  } catch (error) {
    console.error('Error fetching events from Google Calendar:', error);

    // If error is 401, refresh the access token
    if (error.response && error.response.status === 401) {
      console.log('Access token expired, refreshing...');
      try {
        const newAccessToken = await refreshAccessToken(refreshToken);

        // Update the access token in Airtable
        await updateAccessTokenInAirtable(email, newAccessToken);

        // Retry fetching events with the new access token
        await fetchGoogleCalendarEvents(email);
      } catch (refreshError) {
        console.error('Error refreshing access token:', refreshError);
      }
    }

    loading.value = false; // Hide loader on error
  }
};

// Function to refresh the access token using the refresh token
// Function to refresh the access token using the refresh token
const refreshAccessToken = async (refreshToken) => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;

  // Log the clientId, clientSecret, and refreshToken for debugging
  console.log('clientId:', clientId);
  console.log('clientSecret:', clientSecret);
  console.log('refreshToken:', refreshToken);

  // Ensure clientId and clientSecret are defined
  if (!clientId || !clientSecret) {
    console.error('Missing Google OAuth client credentials');
    throw new Error('Missing Google OAuth client credentials');
  }

  try {
    const response = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    // Log the response data for debugging
    console.log('New access token response:', response.data);

    return response.data.access_token;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
};

// Function to update the access token in Airtable
const updateAccessTokenInAirtable = async (email, newAccessToken) => {
  const photographer = airtableData.value.find(
    (item) => item.fields.Email === email
  );

  const recordId = photographer.id; // Assuming this is the Airtable record ID

  await axios.patch(
    `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}/${recordId}`,
    {
      fields: {
        AccessToken: newAccessToken,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${airtableToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
};

// Watch the selected photographer and fetch Google Calendar events on change
watch(
  () => bookingData.value.selectedPhotographer,
  (newVal) => {
    if (newVal) {
      fetchGoogleCalendarEvents(newVal);
    }
  },
  { immediate: true } // Ensures the first click triggers the API call
);

// Generate time slots for every 15 minutes from 9:00 AM to 5:00 PM
const generateTimeSlots = () => {
  const start = moment().hour(9).minute(0).second(0); // Start at 9 AM
  const end = moment().hour(17).minute(0).second(0); // End at 5 PM
  const times = [];

  while (start.isBefore(end)) {
    times.push({
      time: start.format('hh:mm A'),
      available: true,
    });
    start.add(15, 'minutes');
  }
  return times;
};

// Generate date and time slots
const generateDateSlots = () => {
  const dateSlots = [];
  const now = moment().tz('America/Denver');

  // Loop to generate slots for the next 10 days
  for (let i = 0; i < 10; i++) {
    const date = moment().tz('America/Denver').add(i, 'days');
    const dateString = date.format('YYYY-MM-DD');

    dateSlots.push({
      date: dateString,
      times: generateTimeSlots(), // Use the generated 15-minute intervals
    });
  }
  return dateSlots;
};

// Reinitialize dateSlots
const resetDateSlots = () => {
  dateSlots.value = generateDateSlots();
  bookingData.value.selectedTime = null; // Reset selected time
  bookingData.value.selectedDate = null; // Reset selected date
  selectedSlot.value = null; // Clear the selected slot
};

// Helper function to convert time to Date object using Moment.js
const convertToDateTime = (dateStr, time) => {
  return moment.tz(
    `${dateStr} ${time}`,
    'YYYY-MM-DD hh:mm A',
    'America/Denver'
  );
};

// Function to select a date slot
const selectDate = (slot) => {
  selectedSlot.value = slot;
  bookingData.value.selectedDate = slot.date; // Save the selected date to bookingData
};

// Function to select a time slot
const selectTime = (timeSlot) => {
  bookingData.value.selectedTime = timeSlot.time;
};

// Submit the event to Google
const submit = async () => {
  // Ensure a photographer and time are selected
  if (!bookingData.value.selectedPhotographer || !bookingData.value.selectedTime) {
    alert('Please select a photographer and a time.');
    return;
  }

  const photographer = airtableData.value.find(
    (item) => item.fields.Email === bookingData.value.selectedPhotographer
  );

  const accessToken = photographer.fields.AccessToken;

  const eventPayload = {
    summary: 'Photography Session Booking',
    description: `Your session with ${photographer.fields.Name}`,
    start: {
      dateTime: convertToDateTime(bookingData.value.selectedDate, bookingData.value.selectedTime).toISOString(),
      timeZone: 'America/Denver',
    },
    end: {
      dateTime: convertToDateTime(bookingData.value.selectedDate, bookingData.value.selectedTime)
        .add(1, 'hours')
        .toISOString(), // Assuming each session is 1 hour long
      timeZone: 'America/Denver',
    },
  };

  try {
    const response = await axios.post(
      `https://www.googleapis.com/calendar/v3/calendars/${bookingData.value.selectedPhotographer}/events`,
      eventPayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    alert('Your booking has been added to the photographer\'s Google Calendar!');
    console.log('Event created:', response.data);
  } catch (error) {
    console.error('Error creating event in Google Calendar:', error);
    alert('Failed to create event in Google Calendar.');
  }
};
</script>

<style scoped>
.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #1a73e8;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
