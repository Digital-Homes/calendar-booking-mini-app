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
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, onMounted } from "vue";
import axios from "axios";

const props = defineProps({
  userid: String,
});

const customerId = props.userid;
const selectedOrder = ref(null); // To store the selected order
const parsedImages = ref([]);
const orders = ref([]);

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

onMounted(async () => {
  await fetchAndStoreOrders();
});
</script>

<style scoped>
/* Add relevant styles */
</style>
