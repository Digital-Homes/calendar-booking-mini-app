<template>
  <div>
    <!-- <h2>{{ filteredPhotographers }}</h2> -->
    <div v-if="loading" class="spinner"></div>
    <div v-else>
      <div v-if="photographers.length === 0">
        <p>No photographers available.</p>
      </div>
      <FormKit
        type="radio"
        v-model="bookingData.selectedPhotographer"
        label="Choose Photographer"
        :options="
          filteredPhotographers.map((photographer) => ({
            value: photographer.id,
            label: photographer.fields['Display Name'],
            profilePic:
              photographer.fields['Profile Picture']?.[0]?.thumbnails?.small
                ?.url,
          }))
        "
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
      </FormKit>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { ref, onMounted, computed } from "vue";

const bookingData = ref({
  selectedPhotographer: null,
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

    return {
      photographers,
      loading,
      fetchPhotographers,
      bookingData,
      filteredPhotographers, // Use this to access filtered photographers in your template
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
