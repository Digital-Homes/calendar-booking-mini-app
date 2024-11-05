<template>
  <div>
    <div class="p-4 space-y-6">
      <h3
        v-if="selectedOrder == null"
        class="text-xl font-semibold text-gray-800 mb-6"
      >
        Select An Order to View Images
      </h3>

      <!-- Display the orders as cards in a grid layout -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      >
        <div
          v-if="selectedOrder == null"
          v-for="order in orders"
          :key="order.id"
          class="order-card bg-white p-4 rounded-lg shadow hover:bg-gray-100 cursor-pointer transition duration-300"
          @click="selectOrder(order)"
        >
          <!-- Display cover image -->
          <img
            v-if="order.cover && order.cover.length > 0"
            :src="order.cover[0]?.url"
            alt="Cover Image"
            class="cover-image w-full h-40 object-cover rounded-lg"
          />

          <!-- Display address -->
          <div class="mt-2">
            <p class="text-lg font-medium text-gray-700">
              {{ order.address }}
            </p>
          </div>
        </div>
      </div>

      <!-- If an order is selected, display its images -->
      <div v-if="selectedOrder && showImageSelection" class="mt-8">
        <h4 class="text-xl font-semibold text-gray-800 mb-4">
          Images from the Order
        </h4>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div
            v-for="(image, index) in parsedImages"
            :key="index"
            class="relative group"
          >
            <div @click="toggleImageSelection(index)" class="cursor-pointer">
              <img
                :src="image"
                alt="Order Image"
                class="order-image w-full h-32 object-cover rounded-lg shadow-md"
                :class="{
                  'border-4 border-pink-500': selectedImages.includes(image),
                }"
              />
            </div>

            <div
              v-if="selectedImages.includes(image)"
              class="absolute top-2 right-2 bg-pink-500 text-white rounded-full p-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        </div>
        <div v-if="selectedImages.length > 0">
          <FormKit type="button" label="Next" @click="handleImagesSelected" />
        </div>
      </div>

      <div v-if="!showImageSelection">
        <div v-if="currentImageIndex < selectedImages.length">
          <div class="image-option-card">
            <img
              :src="selectedImages[currentImageIndex]"
              alt="Selected Image"
              class="w-64 h-64 object-cover rounded-lg mb-4"
            />
            <p>Choose the type of virtual staging you want:</p>
            <select
              v-model="selectedImageOptions[currentImageIndex]"
              class="mb-4"
              @change="handleOptionChange(currentImageIndex)"
            >
              <option disabled value="">Choose an option</option>
              <option value="placement">Furniture Placement</option>
              <option value="removal">Furniture Removal</option>
              <option value="removalAndPlacement">
                Furniture Removal & Replacement
              </option>
            </select>

            <!-- Show room options -->
            <div
              v-if="
                ['placement', 'removalAndPlacement'].includes(
                  selectedImageOptions[currentImageIndex]
                )
              "
              class="grid grid-cols-2 gap-4 mt-4"
            >
              <div
                v-for="room in roomOptions"
                :key="room"
                class="room-option bg-gray-100 p-4 rounded-lg shadow hover:bg-gray-200 cursor-pointer text-center"
                @click="selectRoomOption(currentImageIndex, room)"
                :class="{
                  'bg-pink-200':
                    selectedRoomOptions[currentImageIndex] === room,
                }"
              >
                {{ room }}
              </div>
            </div>

            <!-- Show style options if a room is selected -->
            <div
              v-if="selectedRoomOptions[currentImageIndex]"
              class="grid grid-cols-2 gap-4 mt-4"
            >
              <p class="col-span-full text-lg font-semibold">Choose a style:</p>
              <div
                v-for="style in styleOptions"
                :key="style"
                class="style-option bg-gray-100 p-4 rounded-lg shadow hover:bg-gray-200 cursor-pointer text-center"
                @click="selectStyleOption(currentImageIndex, style)"
                :class="{
                  'bg-pink-200':
                    selectedStyleOptions[currentImageIndex] === style,
                }"
              >
                {{ style }}
              </div>
            </div>
            <div v-if="fetchedImages.length > 0">
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <div
                  v-for="(image, index) in fetchedImages.slice(0, imagesToShow)"
                  :key="index"
                  class="relative"
                >
                  <img
                    :src="image"
                    alt="Fetched Image"
                    class="w-full h-32 object-cover rounded-lg shadow-md"
                  />
                </div>
              </div>

              <button
                v-if="fetchedImages.length > imagesToShow"
                class="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
                @click="imagesToShow += 12"
              >
                Load More
              </button>
            </div>
          </div>

          <FormKit
            type="button"
            label="Next"
            @click="handleNextImage"
            v-if="
              selectedImageOptions[currentImageIndex] === 'removal' ||
              (selectedImageOptions[currentImageIndex] &&
                selectedRoomOptions[currentImageIndex] &&
                selectedStyleOptions[currentImageIndex] &&
                currentImageIndex < selectedImages.length - 1)
            "
          />

          <FormKit
            type="button"
            label="Checkout"
            @click="handleCheckout"
            v-if="
              selectedImageOptions[currentImageIndex] &&
              selectedRoomOptions[currentImageIndex] &&
              selectedStyleOptions[currentImageIndex] &&
              currentImageIndex === selectedImages.length - 1
            "
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, onMounted, computed } from "vue";
import axios from "axios";

const props = defineProps({
  userid: String,
});

const customerId = props.userid;
const selectedOrder = ref(null); // To store the selected order
const parsedImages = ref([]);
const orders = ref([]);
const selectedImages = ref([]); // To store the URLs of the selected images
const showImageSelection = ref(true);
const currentImageIndex = ref(0);
const selectedImageOptions = ref(Array(selectedImages.value.length).fill(""));
const selectedAction = ref("");
const selectedRoomOptions = ref(Array(selectedImages.value.length).fill(""));
const selectedStyleOptions = ref(Array(selectedImages.value.length).fill(""));
const fetchedImages = ref([]); // To store the images fetched from Airtable
const imagesToShow = ref(12); // Number of images to show by default

const roomOptions = [
  "Bedroom",
  "Dining Room",
  "Living Room",
  "Outdoor Room",
  "Study Room",
];
const styleOptions = [
  "Modern",
  "Contemporary",
  "Scandinavian",
  "Industrial",
  "Farmhouse",
  "Hampton",
  "Traditional",
];

const selectOrder = (order) => {
  selectedOrder.value = order;

  // Parse the comma-separated `pics` URLs and store them in parsedImages
  if (order.pics) {
    parsedImages.value = order.pics.split(",").map((url) => url.trim());
  }
};

const fetchAndStoreOrders = async () => {
  orders.value = await fetchOrdersFromAirtable(customerId); // Fetch orders and store them
};

const fetchOrdersFromAirtable = async (id) => {
  const airtableApiKey = import.meta.env.VITE_AIRTABLE_TOKEN;
  const airtableBaseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
  const airtableTableName = import.meta.env.VITE_ORDER_TABLE_NAME;

  try {
    const response = await axios.get(
      `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`,
      {
        headers: {
          Authorization: `Bearer ${airtableApiKey}`,
          "Content-Type": "application/json",
        },
        params: {
          filterByFormula: `AND({Agent ID} = '${customerId}', {Order Status} = 'Completed')`,
        },
      }
    );

    const orders = response.data.records.map((record) => ({
      pics: record.fields["Images URLs"],
      id: record.id,
      cover: record.fields["Cover Image"],
      address: record.fields["Address"],
    }));
    console.log("Fetched orders:", orders);
    return orders;
  } catch (error) {
    console.error("Error fetching orders from Airtable:", error);
  }
};

const toggleImageSelection = (index) => {
  const imageUrl = parsedImages.value[index]; // Get the URL using the index
  if (selectedImages.value.includes(imageUrl)) {
    selectedImages.value = selectedImages.value.filter(
      (img) => img !== imageUrl
    );
  } else {
    selectedImages.value.push(imageUrl);
  }
};

const handleImagesSelected = () => {
  showImageSelection.value = false; // Hide the image grid
};

const selectOption = (index, option) => {
  selectedImageOptions.value[index] = option;
  // Check if all images have a chosen option
  if (selectedImageOptions.value.every((opt) => opt !== null)) {
    console.log("All options selected:", selectedImageOptions.value);
  }
};

const selectRoomOption = (index, room) => {
  selectedRoomOptions.value[index] = room;
};

const handleNextImage = () => {
  if (currentImageIndex.value < selectedImages.value.length - 1) {
    currentImageIndex.value++;
  }
};

const handleOptionChange = (index) => {
  // Reset the selected room option if a non-room-requiring option is chosen
  if (
    !["placement", "removalAndPlacement"].includes(
      selectedImageOptions.value[index]
    )
  ) {
    selectedRoomOptions.value[index] = "";
  }
};

const handleCheckout = () => {
  console.log(
    "Proceeding to checkout with options:",
    selectedImageOptions.value
  );
  // Add your checkout logic here
};

const selectStyleOption = (index, style) => {
  selectedStyleOptions.value[index] = style;

  // Fetch images only if both room and style are selected
  const selectedRoom = selectedRoomOptions.value[index];
  if (selectedRoom && style) {
    fetchImagesByRoomAndStyle(selectedRoom, style);
  }
  console.log(selectedRoom);
  console.log(style);
};

const fetchImagesByRoomAndStyle = async (room, style) => {
  const airtableApiKey = import.meta.env.VITE_AIRTABLE_TOKEN;
  const airtableBaseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
  const virtualCatalogueTable = import.meta.env.VITE_VIRTUAL_CATALOGUE_TABLE; // Update with your image table name
  console.log("fetching....");

  try {
    const response = await axios.get(
      `https://api.airtable.com/v0/${airtableBaseId}/${virtualCatalogueTable}`,
      {
        headers: {
          Authorization: `Bearer ${airtableApiKey}`,
          "Content-Type": "application/json",
        },
        params: {
          filterByFormula: `AND({Room Type} = '${room}', {Style} = '${style}')`, // Update your formula accordingly
        },
      }
    );

    fetchedImages.value = response.data.records.map(
      (record) => record.fields["Image URL"]
    );
  } catch (error) {
    console.error("Error fetching images from Airtable:", error);
  }
  console.log(fetchedImages.value);
};

onMounted(async () => {
  await fetchAndStoreOrders();
});
</script>

<style scoped>
/* Add relevant styles */
</style>
