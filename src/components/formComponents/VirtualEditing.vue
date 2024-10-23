<template>
  <FormKit type="form" @submit="handleSubmit">
    <!-- Step 1: Upload or Select from Previous Orders -->
    <div v-if="step === 1">
      <h3>Step 1: Upload your Images or Select from Previous Orders</h3>
      <FormKit
        type="file"
        name="images"
        label="Upload Your Images"
        multiple
        @change="handleImageUpload"
      />
      <div v-if="pastOrders.length">
        <h4>Select from Previous Orders</h4>
        <ul>
          <li v-for="order in pastOrders" :key="order.id">
            <input
              type="radio"
              :value="order.id"
              v-model="selectedOrder"
              :id="'order-' + order.id"
            />
            <label :for="'order-' + order.id">{{ order.name }}</label>
          </li>
        </ul>
      </div>
      <FormKit type="button" label="Next" @click="nextStep" />
    </div>

    <!-- Step 2: Virtual Staging Options -->
    <div v-if="step === 2">
      <h3>Step 2: Select Virtual Staging Options</h3>
      <FormKit
        type="select"
        v-model="stagingType"
        :options="stagingOptions"
        label="Select Staging Type"
      />
      <FormKit
        type="select"
        v-model="numImages"
        :options="imageNumberOptions"
        label="Number of Images"
      />
      <FormKit type="button" label="Next" @click="nextStep" />
    </div>

    <!-- Step 3: Room Types -->
    <div v-if="step === 3 && needsReplacement">
      <h3>Step 3: Select Room Types</h3>
      <FormKit
        type="checkbox"
        v-model="selectedRooms"
        :options="roomOptions"
        label="Select Rooms"
      />
      <FormKit type="button" label="Next" @click="nextStep" />
    </div>

    <!-- Step 4: Room Options -->
    <div v-if="step === 4">
      <h3>Step 4: Select Style Options for Each Room</h3>
      <div v-for="room in selectedRooms" :key="room">
        <h4>{{ room }}</h4>
        <FormKit
          type="checkbox"
          v-model="roomStyles[room]"
          :options="getRoomStyles(room)"
          :label="'Select Styles for ' + room"
        />
      </div>
      <FormKit type="submit" label="Submit" />
    </div>
  </FormKit>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import axios from "axios";

export default {
  setup() {
    const step = ref(1);
    const customerID = "your-customer-id"; // Assume this is passed or fetched
    const pastOrders = ref([]);
    const selectedOrder = ref(null);
    const images = ref([]);
    const stagingType = ref("");
    const numImages = ref("");
    const selectedRooms = ref([]);
    const roomStyles = ref({});

    const stagingOptions = [
      { value: "Placement Only", label: "Placement Only" },
      { value: "Removal Only", label: "Removal Only" },
      { value: "Removal & Replacement", label: "Both Removal & Replacement" },
    ];

    const imageNumberOptions = [
      { value: "1-4", label: "1-4 Images" },
      { value: "5-9", label: "5-9 Images" },
      { value: "10+", label: "10+ Images" },
    ];

    const roomOptions = ["Bedroom", "Bathroom", "Living Room", "Office"];

    const getRoomStyles = (room) => {
      // Fetch room styles from Airtable based on the room
      // Example options; replace this with actual data fetching from Airtable
      return [
        { value: "Modern", label: "Modern" },
        { value: "Classic", label: "Classic" },
      ];
    };

    const needsReplacement = computed(() =>
      stagingType.value.includes("Replacement")
    );

    const nextStep = () => {
      step.value++;
    };

    const handleImageUpload = (e) => {
      images.value = e.target.files;
      // Handle image upload to Airtable here
      const formData = new FormData();
      for (const file of images.value) {
        formData.append("images", file);
      }
      axios.post("/airtable/upload-endpoint", formData).then((response) => {
        console.log("Images uploaded successfully", response.data);
      });
    };

    const fetchPastOrders = () => {
      // Fetch past orders from Airtable based on customerID
      axios
        .get(`/airtable/orders?customerID=${customerID}`)
        .then((response) => {
          pastOrders.value = response.data.records;
        });
    };

    const handleSubmit = () => {
      // Submit the form data
      const data = {
        images: images.value,
        selectedOrder: selectedOrder.value,
        stagingType: stagingType.value,
        numImages: numImages.value,
        selectedRooms: selectedRooms.value,
        roomStyles: roomStyles.value,
      };
      axios.post("/airtable/submit-endpoint", data).then((response) => {
        console.log("Form submitted successfully", response.data);
      });
    };

    onMounted(() => {
      fetchPastOrders();
    });

    return {
      step,
      pastOrders,
      selectedOrder,
      images,
      stagingType,
      numImages,
      stagingOptions,
      imageNumberOptions,
      selectedRooms,
      roomOptions,
      roomStyles,
      getRoomStyles,
      needsReplacement,
      nextStep,
      handleSubmit,
      handleImageUpload,
    };
  },
};
</script>

<style scoped>
/* Add any additional styling if needed */
</style>
