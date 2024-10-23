<template>
  <div>
    <div
      v-if="loading"
      class="flex flex-col items-center justify-center min-h-screen"
    >
      <div class="spinner"></div>
      <h2 class="font-['DM_Sans']">Loading photographers in your area</h2>
    </div>
    <div v-else>
      <!-- Step 1: Choose Photographer -->
      <div v-if="!bookingData.selectedPhotographer">
        <div v-if="filteredPhotographers.length === 0">
          <div v-if="!showInquirySentScreen">
            <p class="font-['DM_Sans']">No photographers available.</p>
            <FormKit
              type="button"
              label="Get in Touch"
              @click="sendEmail"
              class="mt-4 bg-blue-500 text-white py-2 px-4 rounded"
            />
          </div>
          <div v-if="showInquirySentScreen">
            <p class="font-['DM_Sans']">
              Thanks for your inquiry! We’ll be in touch within 24 hours!
            </p>
          </div>
        </div>
        <FormKit
          v-else
          type="radio"
          v-model="bookingData.selectedPhotographer"
          label="Choose Photographer"
          :options="
            filteredPhotographers.map((photographer) => ({
              value: {
                email: photographer.fields.Email,
                id: photographer.id,
                name: photographer.fields['Display Name'],
              },
              label: photographer.fields['Display Name'],
              profilePic:
                photographer.fields['Profile Picture']?.[0]?.thumbnails?.large
                  ?.url,
              rating: photographer.fields['Final Rating'], // Add the rating field
              website: photographer.fields['Profile URL'],
            }))
          "
          @input="handlePhotographerSelected"
          :classes="{
            outer: 'mb-8',
            wrapper: 'flex flex-wrap',
            option:
              'flex items-center border-2 border-pink-300 bg-pink-50 rounded-lg p-4 m-2 cursor-pointer hover:border-pink-700 shadow-sm',
            decorator: 'hidden',
            messages: 'mt-4',
          }"
          validation="required"
          :validation-messages="{
            required: 'Please choose a photographer to continue',
          }"
        >
          <template #label="context">
            <div class="flex items-center cursor-pointer w-full">
              <img
                :src="context.option.profilePic"
                alt="Photographer's profile picture"
                class="w-16 h-16 rounded-full mr-4"
              />
              <div class="flex-1">
                <div
                  class="text-base font-medium text-[#3F3F3F] leading-[20.83px] font-['DM_Sans']"
                >
                  {{ context.option.label }}
                </div>
                <div class="flex items-center mb-1">
                  <i
                    v-for="i in 5"
                    :key="i"
                    class="text-[#FFE013]"
                    :class="
                      i <= context.option.rating ? 'fas fa-star' : 'far fa-star'
                    "
                  ></i>
                </div>
                <div class="text-sm ml-auto">
                  <a
                    :href="context.option.website"
                    target="_blank"
                    class="text-[#EB36C5] hover:underline"
                  >
                    View Profile
                  </a>
                </div>
              </div>
            </div>
          </template>
        </FormKit>
      </div>

      <!-- Step 2: Display Selected Photographer and Available Time Slots -->
      <div v-if="bookingData.selectedPhotographer">
        <div
          class="flex items-center justify-between p-4 bg-pink-50 border-2 border-pink-300 rounded-lg shadow-sm"
        >
          <div class="flex items-center">
            <img
              :src="
                getPhotographerDetails(bookingData.selectedPhotographer)
                  ?.profilePic
              "
              alt="Selected Photographer's Profile Picture"
              class="w-16 h-16 rounded-full mr-4"
            />
            <div>
              <h3
                class="text-base font-medium text-[#3F3F3F] leading-[20.83px] font-['DM_Sans']"
              >
                {{
                  getPhotographerDetails(bookingData.selectedPhotographer)?.name
                }}
              </h3>
              <div class="flex items-center mt-1">
                <span v-for="star in 5" :key="star" class="text-[#FFE013]">
                  <i
                    v-if="
                      star <=
                      getPhotographerDetails(bookingData.selectedPhotographer)
                        ?.rating
                    "
                    class="fas fa-star"
                  ></i>
                  <i v-else class="far fa-star"></i>
                </span>
              </div>
            </div>
          </div>
          <div>
            <a
              :href="
                getPhotographerDetails(bookingData.selectedPhotographer)
                  ?.website
              "
              target="_blank"
              class="text-[#EB36C5] hover:underline"
            >
              View profile
            </a>
          </div>
        </div>

        <h3 class="font-['DM_Sans'] text-lg mb-2 mt-5">Select a Date</h3>
        <div
          v-if="loadingDates && bookingData.availableSlots.length == 0"
          class="font-['DM_Sans']"
        >
          <h3>Loading available dates...</h3>
        </div>
        <select
          v-if="!loadingDates && bookingData.availableSlots.length != 0"
          v-model="bookingData.selectedDate"
          @change="selectDate(bookingData.selectedDate)"
          class="variant-dropdown text-sm font-100 font-['DM_Sans']"
        >
          <option
            v-for="(slots, date) in bookingData.availableSlots"
            :key="date"
            :value="date"
          >
            {{ date }}
          </option>
        </select>

        <div v-if="isGeneratingSlots" class="font-['DM_Sans']">
          <p>Loading available time slots...</p>
        </div>

        <div
          v-else-if="slotsForSelectedDate && slotsForSelectedDate.length > 0"
        >
          <h4 class="font-['DM_Sans'] text-lg mb-4 mt-5">
            Available Start Times
          </h4>
          <ul class="flex flex-wrap justify-center gap-4 font-['DM_Sans']">
            <li
              v-for="slot in slotsForSelectedDate"
              :key="slot"
              class="time-slot flex-1 p-4 border-2 rounded-lg text-center cursor-pointer transition bg-white shadow-md hover:shadow-lg hover:border-pink-400"
              :class="{
                'bg-pink-100 text-pink-500 border-pink-500':
                  bookingData.selectedSlot &&
                  bookingData.selectedSlot.time === slot,
                'text-gray-800 border-gray-200':
                  !bookingData.selectedSlot ||
                  bookingData.selectedSlot.time !== slot,
              }"
              @click="selectTimeSlot(bookingData.selectedDate, slot)"
            >
              {{ slot }}
            </li>
          </ul>
        </div>

        <div
          v-else-if="
            bookingData.selectedDate && slotsForSelectedDate.length == 0
          "
        >
          <p class="font-['DM_Sans']">
            No time slots available for this date. Choose a different date.
          </p>
        </div>

        <div
          v-if="bookingData.selectedSlot.time"
          class="flex items-center justify-center p-4 bg-pink-50 border-2 border-pink-300 rounded-lg shadow-sm mt-5"
        >
          <h3 class="text-[#EB36C5]">
            Photographer: {{ bookingData.selectedPhotographerName }} Date:
            {{ bookingData.selectedDate }} Hour:
            {{ bookingData.selectedSlot.time }}
          </h3>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import axios from "axios";
import {
  ref,
  onMounted,
  computed,
  reactive,
  defineEmits,
  defineProps,
} from "vue";

const props = defineProps({
  selectedProducts: {
    type: Array,
    required: true,
  },
  duration: {
    type: Number,
  },
  zipcode: {
    type: Number,
  },
});

const photographers = ref([]);
const loading = ref(true);
const bookingData = reactive({
  selectedPhotographer: null,
  selectedPhotographerName: "",
  selectedPhotographerID: null,
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
const emit = defineEmits(["updateBookingData"]);
const loadingDates = ref(false);
const showInquirySentScreen = ref(false);

const airtableBaseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
const photographerTable = import.meta.env.VITE_PHOTOGRAPHER_TABLE_ID;
const airtableToken = import.meta.env.VITE_AIRTABLE_TOKEN;

const selectTimeSlot = (date, slot) => {
  bookingData.selectedSlot = { date, time: slot }; // Store the date and time as an object
  // Emit an event to the parent component to notify that a slot has been selected
  emit("updateBookingData", bookingData);
};

const selectDate = (date) => {
  bookingData.selectedDate = date; // Update to use bookingData
};

// Function to fetch photographers from Airtable
const fetchPhotographers = async () => {
  loading.value = true;

  try {
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
    const photographerServices = photographer.fields.Services || []; // Ensure it's defined
    const matchesProducts = props.selectedProducts.every((product) =>
      photographerServices.includes(product.id)
    );

    // Add filtering by ZIP code
    const photographerZipCodes = photographer.fields["Service Zip Codes"]
      ? photographer.fields["Service Zip Codes"]
          .split(",")
          .map((zip) => zip.trim())
      : [];
    const matchesZipCode =
      !props.zipcode || photographerZipCodes.includes(props.zipcode.toString());

    // Return true if both conditions are met
    return matchesProducts && matchesZipCode;
  });
});

// Function to check the calendar availability using the freebusy endpoint
const fetchCalendarAvailability = async (
  accessToken,
  calendarId = "primary"
) => {
  try {
    loadingDates.value = true;
    const response = await axios.post(
      `https://www.googleapis.com/calendar/v3/freeBusy`,
      {
        timeMin: new Date().toISOString(),
        timeMax: new Date(
          new Date().setDate(new Date().getDate() + 14)
        ).toISOString(), // Check availability for the next 14 days
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

const fetchPhotographerSchedule = async (photographerId) => {
  try {
    const response = await axios.get(
      `https://api.airtable.com/v0/${airtableBaseId}/${photographerTable}/${photographerId}`,
      {
        headers: {
          Authorization: `Bearer ${airtableToken}`,
        },
      }
    );

    const photographerRecord = response.data;

    // Check if the photographer overrides the default timing
    const overrideTiming = photographerRecord.fields[
      "Default Availability Override"
    ]
      ? photographerRecord.fields["Default Availability Override"]
      : false;

    // If override is enabled, construct the schedule from Airtable fields
    if (overrideTiming) {
      const photographerSchedule = {
        0: photographerRecord.fields.Sunday
          ? {
              startTime: photographerRecord.fields["Sunday Start Time"],
              endTime: photographerRecord.fields["Sunday End Time"],
            }
          : null,
        1: photographerRecord.fields.Monday
          ? {
              startTime: photographerRecord.fields["Monday Start Time"],
              endTime: photographerRecord.fields["Monday End Time"],
            }
          : null,
        2: photographerRecord.fields.Tuesday
          ? {
              startTime: photographerRecord.fields["Tuesday Start Time"],
              endTime: photographerRecord.fields["Tuesday End Time"],
            }
          : null,
        3: photographerRecord.fields.Wednesday
          ? {
              startTime: photographerRecord.fields["Wednesday Start Time"],
              endTime: photographerRecord.fields["Wednesday End Time"],
            }
          : null,
        4: photographerRecord.fields.Thursday
          ? {
              startTime: photographerRecord.fields["Thursday Start Time"],
              endTime: photographerRecord.fields["Thursday End Time"],
            }
          : null,
        5: photographerRecord.fields.Friday
          ? {
              startTime: photographerRecord.fields["Friday Start Time"],
              endTime: photographerRecord.fields["Friday End Time"],
            }
          : null,
        6: photographerRecord.fields.Saturday
          ? {
              startTime: photographerRecord.fields["Saturday Start Time"],
              endTime: photographerRecord.fields["Saturday End Time"],
            }
          : null,
      };

      // Remove null entries (days photographer is not available)
      Object.keys(photographerSchedule).forEach(
        (key) =>
          photographerSchedule[key] === null && delete photographerSchedule[key]
      );

      return photographerSchedule;
    }

    // If no override, return null to use default 9-5 times
    else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching photographer schedule:", error);
    return null;
  }
};

const generateAvailableTimeSlots = (
  busyTimes,
  requiredDuration, // The total duration required (e.g., 75 minutes)
  slotInterval = 15, // Interval between slots in minutes (default to 15)
  driveTimeBuffer = 30, // Buffer time in minutes before and after the slot
  photographerSchedule, // Photographer's schedule, null if using default
  defaultStartTime = "09:00", // Default start time (9 AM)
  defaultEndTime = "17:00" // Default end time (5 PM)
) => {
  const slots = {};
  const currentDate = new Date();
  loadingDates.value = true;

  // Helper function to convert human-readable times (e.g., "7:00 PM") to 24-hour format (e.g., "19:00")
  function convertTo24HourFormat(timeStr) {
    // Use regex to split time and get hour, minute, and AM/PM
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":");

    // Convert to number
    hours = parseInt(hours, 10);
    minutes = parseInt(minutes, 10);

    // If the time is PM and not 12 PM, add 12 to convert to 24-hour format
    if (modifier === "PM" && hours !== 12) {
      hours += 12;
    }

    // If the time is 12 AM, set hours to 0 (midnight)
    if (modifier === "AM" && hours === 12) {
      hours = 0;
    }

    // Return in "HH:MM" format (24-hour)
    return { hours, minutes };
  }

  // Loop for the next 14 days
  for (let i = 0; i < 14; i++) {
    const dateKey = new Date(currentDate);
    dateKey.setDate(currentDate.getDate() + i);

    const dayOfWeek = dateKey.getDay(); // Get the day of the week (0: Sunday, 6: Saturday)

    // Use photographer's custom schedule if provided, otherwise default 9-5
    const daySchedule =
      photographerSchedule && photographerSchedule[dayOfWeek]
        ? photographerSchedule[dayOfWeek]
        : { startTime: defaultStartTime, endTime: defaultEndTime };

    // Convert startTime and endTime from human-readable format to 24-hour format numbers
    const { hours: startHour, minutes: startMinute } = convertTo24HourFormat(
      daySchedule.startTime
    );
    const { hours: endHour, minutes: endMinute } = convertTo24HourFormat(
      daySchedule.endTime
    );

    const dateString = dateKey.toLocaleDateString("en-US", {
      weekday: "long", // Full day of the week (e.g., "Monday")
      year: "numeric", // Full year (e.g., "2024")
      month: "long", // Full month name (e.g., "October")
      day: "numeric", // Day of the month (e.g., "17")
    });

    // Create an array for the available slots for this specific date
    slots[dateString] = [];

    const slotStart = new Date(dateKey);

    // Check if it's the first day in the loop (i === 0), if so, set the slot start time 20 hours from now
    if (i === 0) {
      const twentyHoursFromNow = new Date(
        currentDate.getTime() + 20 * 60 * 60 * 1000
      );

      // Round to the nearest 15-minute interval
      const minutes = twentyHoursFromNow.getMinutes();
      const roundedMinutes = Math.ceil(minutes / slotInterval) * slotInterval;
      twentyHoursFromNow.setMinutes(roundedMinutes);
      twentyHoursFromNow.setSeconds(0);
      twentyHoursFromNow.setMilliseconds(0);

      slotStart.setHours(twentyHoursFromNow.getHours());
      slotStart.setMinutes(twentyHoursFromNow.getMinutes());
    } else {
      slotStart.setHours(startHour);
      slotStart.setMinutes(startMinute);
    }

    const slotEnd = new Date(dateKey);
    slotEnd.setHours(endHour);
    slotEnd.setMinutes(endMinute);

    while (slotStart < slotEnd) {
      const currentSlotStart = new Date(slotStart);

      // Calculate the time ranges including the drive time buffer
      const bufferStart = new Date(currentSlotStart);
      bufferStart.setMinutes(bufferStart.getMinutes() - driveTimeBuffer);

      const requiredSlotEnd = new Date(currentSlotStart);
      requiredSlotEnd.setMinutes(
        requiredSlotEnd.getMinutes() + requiredDuration
      );

      const bufferEnd = new Date(requiredSlotEnd);
      bufferEnd.setMinutes(bufferEnd.getMinutes() + driveTimeBuffer);

      // Check if the entire duration including buffer times is available
      const isSlotAvailable = busyTimes.every(
        (busy) =>
          new Date(busy.start) >= bufferEnd || // Check if the busy period starts after the buffer end
          new Date(busy.end) <= bufferStart // Check if the busy period ends before the buffer start
      );

      if (
        isSlotAvailable &&
        requiredSlotEnd <= slotEnd &&
        currentSlotStart > new Date()
      ) {
        // Push the time slot only if it fits within the end time and respects the buffer
        slots[dateString].push(
          `${currentSlotStart.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}`
        );
      }

      slotStart.setMinutes(slotStart.getMinutes() + slotInterval); // Move to the next slot interval
    }
  }

  isGeneratingSlots.value = false;
  loadingDates.value = false;
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
    return newAccessToken;
  } catch (error) {
    console.error("Failed to refresh access token:", error);
    return null;
  }
};

// Function to handle photographer selection and fetch available slots for booking
const handlePhotographerSelected = async (selectedPhotographer) => {
  const { email, id, name } = selectedPhotographer;
  try {
    // Fetch the access token from the photographer's table in Airtable using the selected photographer's email
    const airtableBaseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
    const accessTokenTable = import.meta.env.VITE_ACCESS_TOKEN_TABLE_ID; // Table where access tokens are stored
    const airtableToken = import.meta.env.VITE_AIRTABLE_TOKEN;

    const response = await axios.get(
      `https://api.airtable.com/v0/${airtableBaseId}/${accessTokenTable}?filterByFormula=Email='${email}'`,
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
        await saveAccessTokenToAirtable(recordID, newAccessToken, refreshToken);
        accessToken = newAccessToken; // Use the new access token for subsequent requests
      } else {
        console.error("Failed to refresh access token.");
        alert("Could not refresh the photographer's access token.");
        return;
      }
    }

    // Fetch the calendar availability using the access token
    const busyTimes = await fetchCalendarAvailability(accessToken);
    const photographerSchedule = await fetchPhotographerSchedule(id);

    // Generate available slots based on busy times
    const availableSlots = await generateAvailableTimeSlots(
      busyTimes,
      props.duration,
      15,
      30,
      photographerSchedule
    );

    // Set the selected photographer and available slots in bookingData
    bookingData.selectedPhotographer = email;
    bookingData.availableSlots = availableSlots;
    bookingData.selectedPhotographerID = id;
    bookingData.selectedPhotographerName = name;
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
  } catch (error) {
    console.error("Error saving new access token to Airtable:", error);
  }
};

const slotsForSelectedDate = computed(() => {
  const formattedDate = new Date(bookingData.selectedDate).toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  return bookingData.availableSlots[formattedDate]
    ? bookingData.availableSlots[formattedDate]
    : [];
});

const getPhotographerDetails = (email) => {
  const photographer = filteredPhotographers.value.find(
    (p) => p.fields.Email === email
  );
  return photographer
    ? {
        name: photographer.fields["Display Name"],
        rating: photographer.fields["Final Rating"],
        website: photographer.fields["Profile URL"],
        profilePic:
          photographer.fields["Profile Picture"]?.[0]?.thumbnails?.large?.url,
      }
    : null;
};

const sendEmail = async () => {
  const senderEmail = import.meta.env.VITE_SENDER_EMAIL;
  const receiverEmail = import.meta.env.VITE_RECEIVER_EMAIL;
  const brevoKey = import.meta.env.VITE_BREVO_KEY;

  const emailData = {
    sender: { name: "Digital Homes", email: senderEmail },
    to: [{ email: receiverEmail }],
    subject: "Test Email from Vue.js",
    htmlContent: `<p>No Photographers available for zipcode ${props.zipcode} for the following items.</p>
    ${props.selectedProducts}
    `,
  };

  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      emailData,
      {
        headers: {
          "api-key": brevoKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 201) {
      showInquirySentScreen.value = true;
    } else {
      console.alert("error sending email");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Error sending email");
  }
};
</script>

<style scoped>
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

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #000;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
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
.time-slots-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center; /* Center the slots */
  gap: 18px; /* Space between the slots */
  margin-top: 10px;
}

.time-slot {
  background-color: #f0f0f0;
  border-radius: 8px;
  padding: 15px 15px; /* Increased padding for more space */
  cursor: pointer;
  transition: background-color 0.3s;
  text-align: center; /* Center the text inside */
  flex: 1 1 120px; /* Ensure all slots are at least 120px wide and can grow */
  max-width: 120px; /* Limit the width to 120px to keep them uniform */
}

.time-slot:hover {
  background-color: #e0e0e0;
}

@media (min-width: 768px) {
  .time-slot {
    flex: 1 1 150px; /* Increase size for larger screens */
    max-width: 150px; /* Keep the max width for consistency */
  }
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

.variant-dropdown {
  background-size: 12px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100%;
  font-size: 0.9rem;
}
</style>
