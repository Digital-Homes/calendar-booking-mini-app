<template>
  <div class="mx-auto my-10">
    <img
      src="/digitalhomes.svg"
      alt="Digital Homes logo"
      class="w-60 mx-auto mb-8"
    />
    <!-- Next button after choosing slot -->
    <!-- <FormKit
      type="submit"
      v-if="canProceedToNextStep && userInfo.id == ''"
      @click="nextStep"
      label="Proceed to Paymenttt"
      :disabled="!canProceedToNextStep"
      class="formkit-button next-button"
    />

    <FormKit
      type="submit"
      v-if="proceedToCheckout && userInfo.id !== '' && !showThankYouScreen"
      @click="placeOrder"
      label="Place Order"
      class="formkit-button next-button"
    /> -->

    <!-- Service selection step -->
    <FormSelectionStep
      v-if="!serviceSelected"
      @serviceSelected="handleServiceSelected"
      class="max-w-[768px] mx-auto"
    />

    <!-- Email verification step -->
    <EmailStep
      v-if="serviceSelected && !stepCompleted"
      @emailChecked="handleEmailChecked"
      class="max-w-[768px] mx-auto"
    />

    <!-- Property information step (shown only if service is appointment) -->
    <PropertyInfoStep
      v-if="
        serviceSelected === 'appointment' &&
        stepCompleted &&
        !propertyInfoSubmitted
      "
      @propertyInfoSubmitted="handlePropertyInfoSubmitted"
      class="max-w-[768px] mx-auto"
    />

    <!-- Editing style step (shown only if service is editing) -->
    <!-- <EditingStyleStep
      v-if="
        serviceSelected === 'editing' && stepCompleted && !editingStyleSubmitted
      "
      @styleSelected="handleEditingStyleSelected"
    /> -->

    <!-- Property status step (for appointment service) -->
    <PropertyStatusStep
      v-if="
        serviceSelected === 'appointment' &&
        stepCompleted &&
        propertyInfoSubmitted &&
        !propertyStatusSubmitted
      "
      @propertyStatusSubmitted="handlePropertyStatusSubmitted"
      class="max-w-[768px] mx-auto"
    />

    <!-- Category selection step (for both services) -->
    <CategorySelectionStep
      v-if="propertyStatusSubmitted && !categorySelectionSubmitted"
      @categorySelected="handleCategorySelected"
      class="max-w-[768px] mx-auto"
    />

    <!-- Product list and add-on components based on the selected category -->
    <ProductList
      v-if="
        propertyStatusSubmitted &&
        categorySelectionSubmitted &&
        !addOnSelectionStep &&
        !showChoosePhotographerStep &&
        !showThankYouScreen &&
        !showCheckoutComponent
      "
      :category="selectedCategory"
      :squareFootage="propertyInfo.squareFootage"
      @goBackToCategories="handleGoBackToCategories"
      @updateCart="handleCartUpdate"
    />

    <AddOnSelection
      v-if="addOnSelectionStep && !showChoosePhotographerStep"
      @goBack="addOnSelectionStep = false"
      @next="showChoosePhotographerStep = true"
      :selectedProducts="selectedProducts"
      @addToCart="handleAddOnToCart"
    />

    <ChoosePhotographerStep
      v-if="showChoosePhotographerStep && !showCheckoutComponent"
      :selectedProducts="selectedProducts"
      :duration="cart.totalDuration"
      :zipcode="propertyInfo.zipcode"
      @updateBookingData="handleSlotSelected"
      class="max-w-[768px] mx-auto"
    />

    <CheckOut
      v-if="showCheckoutComponent && !showPaymentForm"
      :selectedProducts="selectedProducts"
      :location="propertyInfo.location"
      :appointment="orderBooking.timeslot"
      :notes="propertyInfo.notes"
      :photographer="orderBooking.photographerName"
      :total="cart.totalPrice"
      class="max-w-[768px] mx-auto"
      @placeOrder="handlePlaceOrder"
    />

    <PaymentForm
      v-if="showPaymentForm"
      :total="cart.totalPrice"
      class="max-w-[768px] mx-auto"
      @paymentDone="handlePaymentMade"
    />

    <VirtualEditing
      v-if="serviceSelected === 'editing' && stepCompleted"
      class="max-w-[768px] mx-auto"
      :userid="userInfo.id"
    />

    <!-- Display Total Items and Total Price -->
    <div
      v-if="
        totalItems > 0 &&
        !showThankYouScreen &&
        addOnSelectionStep &&
        !showCheckoutComponent
      "
      class="max-w-[768px] mx-auto font-['DM_Sans'] flex flex-row items-center justify-center mt-5"
    >
      <h3 class="flex-1 text-center">Total: ${{ totalPrice.toFixed(2) }}</h3>
      <div class="flex-none">
        <FormKit
          type="submit"
          @click="handleProceedToCheckout"
          label="Proceed to Checkout"
          class="formkit-button next-button"
        />
      </div>
    </div>

    <!-- Next button after add-ons/products -->
    <div
      v-if="showNextButton && !addOnSelectionStep"
      class="max-w-[1050px] ml-auto mx-auto font-['DM_Sans'] flex flex-col items-center justify-center"
    >
      <div
        v-if="totalItems > 0 && !showThankYouScreen"
        class="w-full ml-auto mx-auto font-['DM_Sans'] flex flex-row justify-between items-center mt-5"
      >
        <h3 class="text-center flex-1">Total: ${{ totalPrice.toFixed(2) }}</h3>
        <div class="flex-none font-['DM_Sans'] ml-auto">
          <FormKit
            type="button"
            label="Next Step"
            @click="handleNext"
            class="mt-4 text-white py-2 px-4 rounded"
          />
        </div>
      </div>
    </div>

    <div
      v-if="showThankYouScreen"
      class="flex flex-col items-center justify-center min-h-screen"
    >
      <h2 class="font-['DM_Sans']">Your appointment has been submitted!</h2>
      <h3 class="font-['DM_Sans']">
        We’ll let you know of any additional details we need.
      </h3>
    </div>

    <!-- Future steps will be placed here -->
  </div>
</template>

<script setup>
import { ref, computed, watch, defineEmits } from "vue";
import axios from "axios";

import EmailStep from "./formComponents/EmailStep.vue";
import FormSelectionStep from "./formComponents/FormSelectionStep.vue";
import PropertyInfoStep from "./formComponents/PropertyInfoStep.vue";
import PropertyStatusStep from "./formComponents/PropertyStatusStep.vue";
import CategorySelectionStep from "./formComponents/CategorySelectionStep.vue";
import ProductList from "./formComponents/ProductList.vue";
import AddOnSelection from "./formComponents/AddOnSelection.vue";
import ChoosePhotographerStep from "./formComponents/ChoosePhotographerStep.vue";
import CheckOut from "./formComponents/CheckOut.vue";
import PaymentForm from "./formComponents/PaymentForm.vue";
import VirtualEditing from "./formComponents/VirtualEditing.vue";

const stepCompleted = ref(false);
const userInfo = ref({ email: "", name: "", id: "" });
const serviceSelected = ref(null);
const propertyInfo = ref({
  location: "",
  squareFootage: 0, // Initialize as a number
  notes: "",
  zipcode: "",
});
const propertyInfoSubmitted = ref(false);
const propertyStatusSubmitted = ref(false);
const categorySelectionSubmitted = ref(false);
const selectedCategory = ref("");
const selectedProducts = ref([]);
const addOnSelectionStep = ref(false);
const showNextButton = ref(false);
const cart = ref({
  items: [],
  totalPrice: 0,
  totalDuration: 0,
});
const showChoosePhotographerStep = ref(false);
const canProceedToNextStep = ref(false);
const proceedToCheckout = ref(false);
const orderBooking = ref({
  photographerID: null,
  photographerName: "",
  timeslot: {},
});
const showThankYouScreen = ref(false);
const userPropertyStatus = [];
const selectedProductIDs = [];
const selectedVariantIDs = [];
const selectedAddonIDs = [];
const showCheckoutComponent = ref(false);
const showPaymentForm = ref(false);

const emit = defineEmits(["updateCart"]);

const handleEmailChecked = (data) => {
  userInfo.value.email = data.email;
  userInfo.value.name = data.name;
  userInfo.value.id = data.id;
  stepCompleted.value = true;
};

const handleServiceSelected = (service) => {
  serviceSelected.value = service;
  stepCompleted.value = false; // Reset to show the email step
};

const handlePropertyInfoSubmitted = (info) => {
  propertyInfo.value = {
    location: info.location,
    squareFootage: parseFloat(info.squareFootage), // Convert to number if it's a string
    notes: info.notes,
    zipcode: parseFloat(info.zipcode),
  };
  propertyInfoSubmitted.value = true;
};

const handlePropertyStatusSubmitted = (propertyStatus) => {
  // Handle the property status here
  if (propertyStatus.ownerOccupied === true) {
    userPropertyStatus.push("Owner Occupied");
  }
  if (propertyStatus.tenantOccupied === true) {
    userPropertyStatus.push("Tenant Occupied");
  }
  if (propertyStatus.vacant == true) {
    userPropertyStatus.push("Vacant");
  }
  if (propertyStatus.furnishedOrStaged == true) {
    userPropertyStatus.push("Furnished or Staged");
  }
  if (propertyStatus.unfurnished === true) {
    userPropertyStatus.push("Unfurnished");
  }
  if (propertyStatus.commercialProperty === true) {
    userPropertyStatus.push("Commercial Property");
  }
  propertyStatusSubmitted.value = true;
};

const handleCategorySelected = (category) => {
  selectedCategory.value = category; // Add this line to store the selected category
  categorySelectionSubmitted.value = true;
};

const handleGoBackToCategories = () => {
  // Reset the state for category selection
  categorySelectionSubmitted.value = false;
  selectedCategory.value = "";
  // You can also reset any other states if necessary
};

const handleProceedToCheckout = () => {
  showCheckoutComponent.value = true;
};

const handleNext = () => {
  if (hasAddOns.value) {
    addOnSelectionStep.value = true; // Show AddOnSelection if there are add-ons
  } else {
    showChoosePhotographerStep.value = true;
    showNextButton.value = false;
  }
};

const totalPrice = computed(() => {
  return cart.value.totalPrice; // Calculate total price based on items in cart
});
const totalItems = computed(() => cart.value.items.length);
const totalDuration = computed(() => {
  return cart.value.totalDuration;
});

const hasAddOns = computed(() => {
  const hasAddOnsValue = cart.value.items.some(
    (product) =>
      product.fields["Add-ons"] && product.fields["Add-ons"].length > 0
  );
  return hasAddOnsValue;
});

const handleCartUpdate = (updatedCartItems) => {
  cart.value.items = updatedCartItems; // Set the new items from the updated cart
  cart.value.totalPrice = updatedCartItems.reduce((total, item) => {
    const price = item.selectedVariant
      ? parseFloat(item.selectedVariant.price)
      : parseFloat(item.fields.Price);
    return total + (!isNaN(price) ? price : 0);
  }, 0);
  cart.value.totalDuration = updatedCartItems.reduce((total, item) => {
    const time = item.selectedVariant
      ? parseFloat(item.selectedVariant.duration)
      : parseFloat(item.fields.Duration);
    return total + (!isNaN(time) ? time : 0);
  }, 0);

  selectedProducts.value = updatedCartItems;
  showNextButton.value = true;
};

const handleAddOnToCart = (addOn) => {
  // Add the selected add-on to the cart
  cart.value.items.push(addOn);
  cart.value.totalPrice += parseFloat(addOn.fields.Price); // Update the total price
  cart.value.totalDuration += parseFloat(addOn.fields.Duration);
  selectedAddonIDs.push(addOn.id);
  showNextButton.value = true; // Show the next button if items are in the cart
};

const handleSlotSelected = (bookingData) => {
  canProceedToNextStep.value = true;
  addOnSelectionStep.value = true;
  showChoosePhotographerStep.value = false;
  orderBooking.value.photographerID = bookingData.selectedPhotographerID;
  orderBooking.value.timeslot = bookingData.selectedSlot;
  orderBooking.value.photographerName = bookingData.selectedPhotographerName;
};

const nextStep = () => {
  // Logic to move to the next step in your main form
  console.log("Proceeding to the next step");
};

const handlePlaceOrder = () => {
  if (userInfo.value.id !== "") {
    placeOrder();
  } else {
    showPaymentForm.value = true;
    console.log("proceed to payment step");
  }
};

const handlePaymentMade = () => {
  showPaymentForm.value = false;
  placeOrder();
};

const placeOrder = async () => {
  const airtableBase = import.meta.env.VITE_AIRTABLE_BASE_ID;
  const agentsTable = import.meta.env.VITE_AGENT_TABLE_NAME;
  const ordersTable = import.meta.env.VITE_ORDER_TABLE_NAME;
  const airtableToken = import.meta.env.VITE_AIRTABLE_TOKEN;

  showCheckoutComponent.value = false;
  addOnSelectionStep.value = false;

  //selected products' id
  selectedProducts.value.forEach((product) => {
    // Push only the ID as a string for selected products
    selectedProductIDs.push(product.id);

    // If there's a selected variant, push only the variant ID as a string
    if (product.selectedVariant) {
      selectedVariantIDs.push(product.selectedVariant.id);
    }
  });

  const duration = cart.value.totalDuration;

  // Convert "Wednesday, October 23, 2024" to "2024-10-23"
  const dateParts = orderBooking.value.timeslot.date.split(", "); // Split by commas
  const [_, monthDay, year] = dateParts; // Get "October 23, 2024"
  const parsedDate = new Date(`${monthDay}, ${year}`); // Create a valid date object
  let shootEndTime = "";

  const formattedDate = parsedDate.toISOString().split("T")[0]; // "2024-10-23"

  // Combine with time (assuming this is already in 24-hour format, like "14:30" for 2:30 PM)
  const shootStartTime = `${formattedDate}T${orderBooking.value.timeslot.time}:00`; // Include seconds

  const startDate = new Date(shootStartTime);
  let endDate;

  if (isNaN(startDate.getTime())) {
    console.error("Invalid start date:", shootStartTime);
  } else {
    // Add duration in minutes (e.g., 75 minutes)
    endDate = new Date(startDate.getTime() + duration * 60000);

    // Format the end time back to "YYYY-MM-DDTHH:mm:ss" (24-hour format)
    shootEndTime = `${formattedDate}T${String(endDate.getHours()).padStart(
      2,
      "0"
    )}:${String(endDate.getMinutes()).padStart(2, "0")}:00`;
  }

  try {
    // Check if the customer does not exist
    if (!userInfo.value.id) {
      // Create a new customer in Airtable
      const customerResponse = await axios.post(
        `https://api.airtable.com/v0/${airtableBase}/${agentsTable}`,
        {
          fields: {
            Email: userInfo.value.email,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${airtableToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (customerResponse.status === 200 || customerResponse.status === 201) {
        const customerId = customerResponse.data.id;
        userInfo.value.id = customerId; // Save the customer record ID

        // Placeholder: Create a new order with the newly created customer ID
        const orderResponse = await axios.post(
          `https://api.airtable.com/v0/${airtableBase}/${ordersTable}`,
          {
            fields: {
              Agent: [customerId], // Pass the existing agent ID to the 'Agent' field
              Type: selectedCategory.value,
              Address: propertyInfo.value.location,
              ["Square Footage"]: propertyInfo.value.squareFootage,
              ["Property Status"]: userPropertyStatus,
              ["Additional Information/Questions/Requests"]:
                propertyInfo.value.notes,
              Services: selectedProductIDs,
              Variant: selectedVariantIDs,
              ["Add-Ons"]: selectedAddonIDs,
              ["Shoot Start Time (Main Product)"]: startDate,
              ["Shoot End Time (Main Product)"]: endDate,
              ["Photographer (Main Product)"]: [
                orderBooking.value.photographerID,
              ],
              ["Order Total"]: cart.value.totalPrice,
              ["Order Status"]: "New Order",
            },
          },
          {
            headers: {
              Authorization: `Bearer ${airtableToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (orderResponse.status === 200 || orderResponse.status === 201) {
          showChoosePhotographerStep.value = false;
          showThankYouScreen.value = true;
        }
      } else {
        console.log(`Something went wrong`, orderResponse);
      }
    } else {
      const orderResponse = await axios.post(
        `https://api.airtable.com/v0/${airtableBase}/${ordersTable}`,
        {
          fields: {
            Agent: [userInfo.value.id], // Pass the existing agent ID to the 'Agent' field
            Type: selectedCategory.value,
            Address: propertyInfo.value.location,
            ["Square Footage"]: propertyInfo.value.squareFootage,
            ["Property Status"]: userPropertyStatus,
            ["Additional Information/Questions/Requests"]:
              propertyInfo.value.notes,
            Services: selectedProductIDs,
            Variant: selectedVariantIDs,
            ["Add-Ons"]: selectedAddonIDs,
            ["Shoot Start Time (Main Product)"]: startDate,
            ["Shoot End Time (Main Product)"]: endDate,
            ["Photographer (Main Product)"]: [
              orderBooking.value.photographerID,
            ],
            ["Order Total"]: cart.value.totalPrice,
            ["Order Status"]: "New Order",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${airtableToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (orderResponse.status === 200 || orderResponse.status === 201) {
        showChoosePhotographerStep.value = false;
        showThankYouScreen.value = true;
      }
    }
  } catch (error) {
    console.error("An error occurred while placing the order:", error);
  }
};

watch(selectedProducts, (newVal) => {
  // Emit an updateCart event whenever the selected products change
  emit("updateCart", newVal);
});
</script>

<style scoped>
/* Global styles for the multi-step form */
</style>
