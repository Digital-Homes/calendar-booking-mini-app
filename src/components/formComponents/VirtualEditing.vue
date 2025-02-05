<template>
  <div class="flex flex-col items-center pt-10 md:pt-20">
    <FormKit type="form">
      <!-- Step 1: Upload or Select from Previous Orders -->

      <div class="flex space-x-8" v-if="step === 1">
        <!-- Card 1: Upload Your Own Images -->
        <div
          class="service-card cursor-pointer flex flex-col items-center justify-center border border-gray-300 rounded-lg shadow-lg transition-transform transform hover:scale-105"
          @click="selectOption('upload')"
        >
          <img
            src="https://res.cloudinary.com/digital-homes/image/upload/v1726770736/logo.png"
            alt="Upload Images"
            class="w-full h-50 object-cover rounded-md mb-2"
          />
          <h4 class="text-m font-normal font-['DM_Sans']">
            Upload Your Own Images
          </h4>
        </div>

        <!-- Card 2: Select from Previous Orders -->
        <div
          class="service-card cursor-pointer flex flex-col items-center justify-center border border-gray-300 rounded-lg shadow-lg transition-transform transform hover:scale-105"
          @click="selectOption('previous')"
        >
          <img
            src="https://res.cloudinary.com/digital-homes/image/upload/v1726770736/logo.png"
            alt="Select from Previous Orders"
            class="w-full h-50 object-cover rounded-md mb-2"
          />
          <h4 class="text-m font-normal font-['DM_Sans']">
            Select from Previous Orders
          </h4>
        </div>
      </div>
      <div v-if="step === 2" class="upload-container">
        <h3>Upload Your Images</h3>

        <!-- File upload input -->
        <FormKit
          type="file"
          name="images"
          label="Choose your images"
          multiple
          accept="image/*"
          @input="handleFileUpload"
        />

        <!-- 'Next' button to proceed -->
        <FormKit type="button" label="Next" @click="generateImageUrls" />
      </div>

      <div v-if="step === 4" class="p-4 space-y-6">
        <h3 class="text-2xl font-semibold text-gray-800 mb-6">
          Select An Order to View Images
        </h3>

        <!-- Display the orders as cards in a grid layout -->
        <div
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          <div
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
        <div v-if="selectedOrder" class="mt-8">
          <h4 class="text-xl font-semibold text-gray-800 mb-4">
            Images from the Order
          </h4>

          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div
              v-for="(image, index) in parsedImages"
              :key="index"
              class="image-card"
            >
              <img
                :src="image"
                alt="Order Image"
                class="order-image w-full h-32 object-cover rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      </div>
    </FormKit>
  </div>
</template>

<script setup>
import { ref, defineProps, onMounted } from "vue";
import axios from "axios";

const step = ref(1);
const selectedFiles = ref([]);
const props = defineProps({
  userid: String,
});
const customerId = props.userid;
const orders = ref([]);
const selectedOrder = ref(null); // To store the selected order
const parsedImages = ref([]);

const selectOption = (option) => {
  console.log("Selected option:", option);
  if (option === "upload") {
    step.value = 2;
  } else if (option === "previous") {
    step.value = 4;
  }
};

const selectOrder = (order) => {
  selectedOrder.value = order;

  // Parse the comma-separated `pics` URLs and store them in parsedImages
  if (order.pics) {
    parsedImages.value = order.pics.split(",").map((url) => url.trim());
  }
};

const handleFileUpload = (files) => {
  selectedFiles.value = files; // Store the uploaded files
};

const generateImageUrls = async () => {
  if (selectedFiles.value.length === 0) {
    console.log("No files selected");
    return;
  }

  try {
    // Step 1: Upload images to Dropbox
    const uploadedUrls = await uploadToDropbox(Array.from(selectedFiles.value));

    // Step 2: Upload the image URLs to Airtable
    await uploadToAirtable(uploadedUrls);

    // Step 3: Move to the next step (e.g., step 3 in your workflow)
    step.value = 3;
  } catch (error) {
    console.error("Error during the process:", error);
  }
};

const uploadToDropbox = async (files) => {
  const uploadedImageUrls = [];

  for (let file of files) {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        "https://content.dropboxapi.com/2/files/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer YOUR_DROPBOX_ACCESS_TOKEN`,
            "Dropbox-API-Arg": JSON.stringify({
              path: `/digital-homes/virtual-staging/${file.name}`,
              mode: "add",
              autorename: true,
              mute: false,
            }),
            "Content-Type": "application/octet-stream",
          },
        }
      );

      // After the file is uploaded, get a shareable link for it
      const fileLinkResponse = await axios.post(
        "https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings",
        {
          path: response.data.path_lower,
          settings: { requested_visibility: "public" },
        },
        {
          headers: {
            Authorization: `Bearer YOUR_DROPBOX_ACCESS_TOKEN`, // Replace with your Dropbox Access Token
            "Content-Type": "application/json",
          },
        }
      );

      // Add the shareable URL to the array
      uploadedImageUrls.push(
        fileLinkResponse.data.url.replace("?dl=0", "?raw=1")
      ); // Get a direct link to the image
    } catch (error) {
      console.error("Error uploading to Dropbox:", error);
    }
  }

  return uploadedImageUrls;
};

const fetchAndStoreOrders = async () => {
  orders.value = await fetchOrdersFromAirtable(customerId); // Fetch orders and store them
};

const fetchOrdersFromAirtable = async (id) => {
  const airtableApiKey = import.meta.env.VITE_AIRTABLE_TOKEN; // Replace with your Airtable API key
  const airtableBaseId = import.meta.env.VITE_AIRTABLE_BASE_ID; // Replace with your Airtable Base ID
  const airtableTableName = import.meta.env.VITE_ORDER_TABLE_NAME; // Replace with your orders table name

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

    // Assuming the data you want is in response.data.records
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

onMounted(async () => {
  await fetchAndStoreOrders();
});
</script>

<style scoped>
.service-card {
  width: 300px; /* Fixed width */
  height: 300px; /* Fixed height to accommodate varying text */
  border-radius: 12px; /* Radius */
  border: 1.5px solid #ccc; /* Border */
  padding: 22px 35px; /* Padding: top-bottom 22px, left-right 35px */
  gap: 21px; /* Gap between items */
  display: flex; /* Flexbox for inner alignment */
  flex-direction: column; /* Stack items vertically */
  align-items: center; /* Center items horizontally */
  justify-content: center; /* Center items vertically */
}
</style>
