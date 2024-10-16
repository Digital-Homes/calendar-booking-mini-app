<template>
  <div>
    <div v-if="loading" class="spinner"></div>
    <div v-else>
      <!-- Step 1: Choose Photographer -->
      <div v-if="!bookingData.selectedPhotographer">
        <div v-if="filteredPhotographers.length === 0">
          <p>No photographers available.</p>
        </div>
        <FormKit
          v-else
          type="radio"
          v-model="bookingData.selectedPhotographer"
          label="Choose Photographer"
          :options="
            filteredPhotographers.map((photographer) => ({
              value: photographer.fields.Email,
              label: photographer.fields['Display Name'],
              profilePic:
                photographer.fields['Profile Picture']?.[0]?.thumbnails?.small
                  ?.url,
            }))
          "
          @input="handlePhotographerSelected"
          :classes="{
            outer: 'mb-8',
            wrapper: 'flex flex-wrap',
            option:
              'flex items-center border-2 border-gray-200 rounded-lg p-4 m-2 cursor-pointer hover:border-gray-800',
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
              <img
                :src="context.option.profilePic"
                alt="Photographer's profile picture"
                class="w-12 h-12 rounded-full mr-4"
              />
              <div class="text-gray-800 text-lg">
                {{ context.option.label }}
              </div>
            </div>
          </template>
        </FormKit>
      </div>

      <!-- Step 2: Display Selected Photographer and Available Time Slots -->
      <div v-if="bookingData.selectedPhotographer">
        <h3>Selected Photographer: {{ bookingData.selectedPhotographer }}</h3>
        <h4>Select a Date</h4>
        <select
          v-model="bookingData.selectedDate"
          @change="selectDate(bookingData.selectedDate)"
        >
          <option
            v-for="(slots, date) in bookingData.availableSlots"
            :key="date"
            :value="date"
          >
            {{ date }}
          </option>
        </select>

        <div v-if="isGeneratingSlots">
          <p>Loading available time slots...</p>
        </div>

        <div
          v-else-if="slotsForSelectedDate && slotsForSelectedDate.length > 0"
        >
          <h4>Available Start Times</h4>
          <ul class="flex flex-wrap justify-center space-x-4">
            <li
              v-for="slot in slotsForSelectedDate"
              :key="slot"
              class="time-slot flex-1 p-4 border-2 rounded-lg text-center bg-white shadow-md hover:shadow-lg transition"
              @click="selectTimeSlot(bookingData.selectedDate, slot)"
            >
              {{ slot }}
            </li>
          </ul>
        </div>

        <div
          v-else-if="bookingData.selectDate && slotsForSelectedDate.length == 0"
        >
          <p>No available time slots for this date.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { ref, onMounted, computed, reactive } from "vue";

export default {
  props: {
    selectedProducts: {
      type: Array,
      required: true,
    },
    duration: {
      type: Number,
    },
  },
  setup(props) {
    const photographers = ref([]);
    const loading = ref(true);
    const bookingData = reactive({
      selectedPhotographer: null,
      availableSlots: [],
      selectedDate: null,
      selectedSlot: {},
    });
    const step = ref(1); // For tracking the current step
    const nextStep = () => {
      step.value += 1;
    };
    const previousStep = () => {
      step.value = Math.max(1, step.value - 1);
    };
    const isGeneratingSlots = ref(false);

    const selectTimeSlot = (date, slot) => {
      bookingData.selectedSlot = { date, time: slot }; // Store the date and time as an object
      console.log(bookingData.selectedSlot);
      nextStep();
    };

    const selectDate = (date) => {
      bookingData.selectedDate = date; // Update to use bookingData
    };

    // Function to fetch photographers from Airtable
    const fetchPhotographers = async () => {
      loading.value = true;

      try {
        const airtableBaseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
        const photographerTable = import.meta.env.VITE_PHOTOGRAPHER_TABLE_ID;
        const airtableToken = import.meta.env.VITE_AIRTABLE_TOKEN;

        const response = await axios.get(
          `https://api.airtable.com/v0/${airtableBaseId}/${photographerTable}`,
          {
            headers: {
              Authorization: `Bearer ${airtableToken}`,
            },
          }
        );

        photographers.value = response.data.records;
      } catch (error) {
        console.error("Error fetching photographers:", error);
      } finally {
        loading.value = false;
      }
    };

    // Fetch photographers on component mount
    onMounted(() => {
      fetchPhotographers();
    });

    // Computed property to filter photographers based on selected products
    const filteredPhotographers = computed(() => {
      if (props.selectedProducts.length === 0) {
        return photographers.value; // Return all if no products are selected
      }

      // Filter logic based on the selected products
      return photographers.value.filter((photographer) => {
        // Assuming 'services' is a linked record field that returns an array of linked record IDs
        const photographerServices = photographer.fields.Services || []; // Ensure it's defined
        return props.selectedProducts.some((product) =>
          photographerServices.includes(product.id)
        );
      });
    });

    // Function to check the calendar availability using the freebusy endpoint
    const fetchCalendarAvailability = async (
      accessToken,
      calendarId = "primary"
    ) => {
      try {
        const response = await axios.post(
          `https://www.googleapis.com/calendar/v3/freeBusy`,
          {
            timeMin: new Date().toISOString(),
            timeMax: new Date(
              new Date().setDate(new Date().getDate() + 14)
            ).toISOString(), // Check availability for the next 7 days
            items: [{ id: calendarId }],
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        return response.data.calendars[calendarId].busy; // Return the busy times of the calendar
      } catch (error) {
        console.error("Error fetching calendar availability:", error);
        return [];
      }
    };

    // Function to generate time slots based on the calendar's busy times and dynamic duration
    const generateAvailableTimeSlots = (
      busyTimes,
      slotDuration = 30, // Slot duration in minutes (default to 30 if not provided)
      startTime = "09:00",
      endTime = "17:00"
    ) => {
      const slots = {};
      const currentDate = new Date();
      // isGeneratingSlots.value = true;

      // Loop for the next 14 days
      for (let i = 0; i < 14; i++) {
        const dateKey = new Date(currentDate);
        dateKey.setDate(currentDate.getDate() + i);
        const dateString = dateKey.toLocaleDateString(); // Format the date as needed

        // Create an array for the available slots for this specific date
        slots[dateString] = [];

        const slotStart = new Date(dateKey);
        slotStart.setHours(parseInt(startTime.split(":")[0]));
        slotStart.setMinutes(parseInt(startTime.split(":")[1]));

        const slotEnd = new Date(dateKey);
        slotEnd.setHours(parseInt(endTime.split(":")[0]));
        slotEnd.setMinutes(parseInt(endTime.split(":")[1]));

        while (slotStart < slotEnd) {
          const currentSlotStart = new Date(slotStart);
          const currentSlotEnd = new Date(slotStart);
          currentSlotEnd.setMinutes(currentSlotEnd.getMinutes() + slotDuration);

          const isSlotAvailable = busyTimes.every(
            (busy) =>
              new Date(busy.start) >= currentSlotEnd ||
              new Date(busy.end) <= currentSlotStart
          );

          if (isSlotAvailable && currentSlotEnd <= slotEnd) {
            // Push the time slot only if it fits within the end time
            slots[dateString].push(
              `${currentSlotStart.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}`
            );
          }

          slotStart.setMinutes(slotStart.getMinutes() + slotDuration);
        }
      }

      isGeneratingSlots.value = false;
      return slots; // Now returns an object with dates and available slots
    };

    const isTokenValid = async (token) => {
      try {
        // Use the Google Userinfo endpoint to validate the token
        const response = await axios.get(
          "https://www.googleapis.com/oauth2/v1/userinfo",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // If the response is successful, the token is valid
        return response.status === 200;
      } catch (error) {
        // If the request fails, assume the token is invalid
        console.error("Token validation failed:", error);
        return false;
      }
    };

    const refreshAccessToken = async (refreshToken) => {
      try {
        const response = await axios.post(
          "https://oauth2.googleapis.com/token",
          null,
          {
            params: {
              client_id: import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID, // Your client ID
              client_secret: import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_SECRET, // Your client secret
              refresh_token: refreshToken,
              grant_type: "refresh_token",
            },
          }
        );

        // Get the new access token from the response
        const newAccessToken = response.data.access_token;
        console.log(`the token was refreshed`);
        return newAccessToken;
      } catch (error) {
        console.error("Failed to refresh access token:", error);
        return null;
      }
    };

    // Function to handle photographer selection and fetch available slots for booking
    const handlePhotographerSelected = async (photographerEmail) => {
      try {
        // Fetch the access token from the photographer's table in Airtable using the selected photographer's email
        const airtableBaseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
        const accessTokenTable = import.meta.env.VITE_ACCESS_TOKEN_TABLE_ID; // Table where access tokens are stored
        const airtableToken = import.meta.env.VITE_AIRTABLE_TOKEN;

        const response = await axios.get(
          `https://api.airtable.com/v0/${airtableBaseId}/${accessTokenTable}?filterByFormula=Email='${photographerEmail}'`,
          {
            headers: {
              Authorization: `Bearer ${airtableToken}`,
            },
          }
        );

        const recordID = response.data.records[0].id;

        // Assuming the response contains the access token in the first record found
        let accessToken =
          response.data.records.length > 0
            ? response.data.records[0].fields["Access Token"]
            : null;

        if (!accessToken) {
          console.error("No access token found for the selected photographer.");
          alert("Failed to retrieve the photographer's access token.");
          return;
        }

        let refreshToken =
          response.data.records.length > 0
            ? response.data.records[0].fields["Refresh Token"]
            : null;
        // Check if the access token is valid
        const tokenValid = await isTokenValid(accessToken);

        if (!tokenValid) {
          // If the token is not valid, refresh it
          const newAccessToken = await refreshAccessToken(refreshToken);

          if (newAccessToken) {
            // Save the new access token back to Airtable
            await saveAccessTokenToAirtable(
              recordID,
              newAccessToken,
              refreshToken
            );
            accessToken = newAccessToken; // Use the new access token for subsequent requests
          } else {
            console.error("Failed to refresh access token.");
            alert("Could not refresh the photographer's access token.");
            return;
          }
        }

        // Fetch the calendar availability using the access token
        const busyTimes = await fetchCalendarAvailability(accessToken);

        // Generate available slots based on busy times
        const availableSlots = generateAvailableTimeSlots(
          busyTimes,
          props.duration
        );

        // Set the selected photographer and available slots in bookingData
        bookingData.selectedPhotographer = photographerEmail;
        bookingData.availableSlots = availableSlots;
        console.log(bookingData.availableSlots);
      } catch (error) {
        console.error("Error fetching the photographer's access token:", error);
        alert(
          "An error occurred while fetching the photographer's details. Please try again."
        );
      }
    };

    const saveAccessTokenToAirtable = async (
      recordID,
      newAccessToken,
      refreshToken
    ) => {
      const airtableBaseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
      const accessTokenTable = import.meta.env.VITE_ACCESS_TOKEN_TABLE_ID; // Table where access tokens are stored
      const airtableToken = import.meta.env.VITE_AIRTABLE_TOKEN;

      try {
        await axios.patch(
          `https://api.airtable.com/v0/${airtableBaseId}/${accessTokenTable}`,
          {
            records: [
              {
                id: recordID,
                fields: {
                  "Access Token": newAccessToken,
                  "Refresh Token": refreshToken, // Save refresh token if it changes
                },
              },
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${airtableToken}`,
            },
          }
        );
        console.log("Access token updated successfully.");
      } catch (error) {
        console.error("Error saving new access token to Airtable:", error);
      }
    };

    const slotsForSelectedDate = computed(() => {
      return bookingData.selectedDate &&
        bookingData.availableSlots[bookingData.selectedDate]
        ? bookingData.availableSlots[bookingData.selectedDate]
        : [];
    });

    return {
      photographers,
      loading,
      fetchPhotographers,
      bookingData,
      filteredPhotographers, // Use this to access filtered photographers in your template
      handlePhotographerSelected, // Handles the photographer selection
      selectDate,
      slotsForSelectedDate,
      selectTimeSlot,
      isGeneratingSlots,
    };
  },
};
</script>

<style scoped>
.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #000;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  animation: spin 1s linear infinite;
}

.photographer-card {
  display: flex;
  align-items: center;
  margin: 1rem 0;
}

.profile-pic {
  width: 50px; /* Adjust as needed */
  height: 50px; /* Adjust as needed */
  border-radius: 50%;
  margin-right: 10px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.time-slots-container {
  display: flex; /* Use flexbox for the layout */
  flex-wrap: wrap; /* Allow items to wrap to the next line */
  justify-content: flex-start; /* Align items to the left */
  gap: 10px; /* Optional: Add some space between slots */
  margin-top: 10px; /* Add some margin above the time slots */
}

.time-slot {
  background-color: #f0f0f0; /* Adjust background color */
  border-radius: 8px; /* Rounded corners */
  padding: 10px 15px; /* Padding around the text */
  cursor: pointer; /* Change cursor on hover */
  transition: background-color 0.3s; /* Smooth transition */
}

.time-slot:hover {
  background-color: #e0e0e0; /* Change background color on hover */
}

/* Responsive styling */
@media (max-width: 600px) {
  .time-slot {
    flex: 1 1 calc(50% - 10px); /* Two slots per row on smaller screens */
  }
}

@media (max-width: 400px) {
  .time-slot {
    flex: 1 1 calc(100% - 10px); /* One slot per row on mobile */
  }
}
</style>
