<template>
  <div>
    <div v-if="loading" class="spinner"></div>
    <div v-else>
      <div v-if="filteredPhotographers.length === 0">
        <p>No photographers available.</p>
      </div>
      <FormKit
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
            <div class="text-gray-800 text-lg">{{ context.option.label }}</div>
          </div>
        </template>
        <div
          v-if="
            bookingData.availableSlots && bookingData.availableSlots.length > 0
          "
        >
          <h3>Available Time Slots</h3>
          <ul>
            <li
              v-for="slot in bookingData.availableSlots"
              :key="slot"
              class="time-slot"
            >
              <button
                class="slot-button"
                @click="
                  createBookingEvent(
                    bookingData.selectedPhotographerAccessToken,
                    'primary',
                    slot
                  )
                "
              >
                {{ slot }}
              </button>
            </li>
          </ul>
        </div>
      </FormKit>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { ref, onMounted, computed } from "vue";

const bookingData = ref({
  selectedPhotographer: null,
  availableSlots: [],
});

export default {
  props: {
    selectedProducts: {
      type: Array,
      required: true,
    },
  },
  setup(props) {
    const photographers = ref([]);
    const loading = ref(true);

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
              new Date().setDate(new Date().getDate() + 7)
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

    // Function to generate 30-minute slots based on the calendar's busy times
    const generateAvailableTimeSlots = (
      busyTimes,
      startTime = "09:00",
      endTime = "17:00"
    ) => {
      const slots = [];
      const currentDate = new Date();
      currentDate.setHours(parseInt(startTime.split(":")[0]));
      currentDate.setMinutes(parseInt(startTime.split(":")[1]));

      const endDate = new Date();
      endDate.setHours(parseInt(endTime.split(":")[0]));
      endDate.setMinutes(parseInt(endTime.split(":")[1]));

      while (currentDate < endDate) {
        const slotStart = new Date(currentDate);
        const slotEnd = new Date(currentDate);
        slotEnd.setMinutes(slotEnd.getMinutes() + 30);

        const isSlotAvailable = busyTimes.every(
          (busy) =>
            new Date(busy.start) >= slotEnd || new Date(busy.end) <= slotStart
        );

        if (isSlotAvailable) {
          slots.push(
            `${slotStart.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })} - ${slotEnd.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}`
          );
        }

        currentDate.setMinutes(currentDate.getMinutes() + 30);
      }

      return slots;
    };

    // Function to handle photographer selection and fetch available slots for booking
    const handlePhotographerSelected = async (photographerEmail) => {
      console.log(`hitting photographer selection ${photographerEmail}`);
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

        // Assuming the response contains the access token in the first record found
        const accessToken =
          response.data.records.length > 0
            ? response.data.records[0].fields["Access Token"]
            : null;

        if (!accessToken) {
          console.error("No access token found for the selected photographer.");
          alert("Failed to retrieve the photographer's access token.");
          return;
        }

        // Fetch the calendar availability using the access token
        const busyTimes = await fetchCalendarAvailability(accessToken);

        // Generate available slots based on busy times
        const availableSlots = generateAvailableTimeSlots(busyTimes);
        console.log(`available slots: ${availableSlots}`);

        // Set the selected photographer and available slots in bookingData
        bookingData.selectedPhotographer = photographerEmail;
        bookingData.availableSlots = availableSlots;
        console.log(bookingData);
      } catch (error) {
        console.error("Error fetching the photographer's access token:", error);
        alert(
          "An error occurred while fetching the photographer's details. Please try again."
        );
      }
    };

    // Function to create a new booking event on the photographer's Google Calendar
    const createBookingEvent = async (
      accessToken,
      calendarId = "primary",
      slot
    ) => {
      const [startTime, endTime] = slot.split(" - ");
      const eventDate = new Date(); // Assuming the event is for today; adjust accordingly for future dates
      const startDateTime = new Date(
        `${eventDate.toDateString()} ${startTime}`
      );
      const endDateTime = new Date(`${eventDate.toDateString()} ${endTime}`);

      try {
        await axios.post(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
          {
            summary: "Photography Session",
            start: {
              dateTime: startDateTime.toISOString(),
              timeZone: "America/Los_Angeles", // Use the appropriate time zone
            },
            end: {
              dateTime: endDateTime.toISOString(),
              timeZone: "America/Los_Angeles",
            },
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        alert("Booking confirmed!");
      } catch (error) {
        console.error("Error creating booking event:", error);
        alert("Failed to create the booking. Please try again.");
      }
    };

    return {
      photographers,
      loading,
      fetchPhotographers,
      bookingData,
      filteredPhotographers, // Use this to access filtered photographers in your template
      handlePhotographerSelected, // Handles the photographer selection
      createBookingEvent,
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
</style>
