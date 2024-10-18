<template>
  <div class="mx-auto my-16 max-w-[768px]">
    <img
      src="/digitalhomes.svg"
      alt="Digital Homes logo"
      class="w-60 mx-auto mb-8"
    />

    <!-- Display Total Items and Total Price -->
    <div v-if="totalItems > 0" class="cart-summary">
      <h3>Total Items: {{ totalItems }}</h3>
      <h3>Total Price: ${{ totalPrice.toFixed(2) }}</h3>
      <h3>Total Duration: {{ totalDuration }} minutes</h3>
    </div>

    <!-- Next button after add-ons/products -->
    <FormKit
      v-if="showNextButton && !addOnSelectionStep"
      type="button"
      label="Next"
      @click="handleNext"
      class="mt-4 bg-blue-500 text-white py-2 px-4 rounded"
    />
    <!-- Next button after choosing slot -->
    <FormKit
      type="submit"
      v-if="canProceedToNextStep"
      @click="nextStep"
      label="Next"
      :disabled="!canProceedToNextStep"
      class="formkit-button next-button"
    />

    <!-- Service selection step -->
    <FormSelectionStep
      v-if="!serviceSelected"
      @serviceSelected="handleServiceSelected"
    />

    <!-- Email verification step -->
    <EmailStep
      v-if="serviceSelected && !stepCompleted"
      @emailChecked="handleEmailChecked"
    />

    <!-- Property information step (shown only if service is appointment) -->
    <PropertyInfoStep
      v-if="
        serviceSelected === 'appointment' &&
        stepCompleted &&
        !propertyInfoSubmitted
      "
      @propertyInfoSubmitted="handlePropertyInfoSubmitted"
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
    />

    <!-- Category selection step (for both services) -->
    <CategorySelectionStep
      v-if="propertyStatusSubmitted && !categorySelectionSubmitted"
      @categorySelected="handleCategorySelected"
    />

    <!-- Product list and add-on components based on the selected category -->
    <ProductList
      v-if="
        propertyStatusSubmitted &&
        categorySelectionSubmitted &&
        !addOnSelectionStep &&
        !showChoosePhotographerStep
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
      v-if="showChoosePhotographerStep"
      :selectedProducts="selectedProducts"
      :duration="cart.totalDuration"
      @updateBookingData="handleSlotSelected"
    />

    <!-- Future steps will be placed here -->
  </div>
</template>

<script setup>
import { ref, computed, watch, defineEmits } from "vue";
import EmailStep from "./formComponents/EmailStep.vue";
import FormSelectionStep from "./formComponents/FormSelectionStep.vue";
import PropertyInfoStep from "./formComponents/PropertyInfoStep.vue";
import PropertyStatusStep from "./formComponents/PropertyStatusStep.vue";
import CategorySelectionStep from "./formComponents/CategorySelectionStep.vue";
import ProductList from "./formComponents/ProductList.vue";
import AddOnSelection from "./formComponents/AddOnSelection.vue";
import ChoosePhotographerStep from "./formComponents/ChoosePhotographerStep.vue";

const stepCompleted = ref(false);
const userInfo = ref({ email: "", name: "" });
const serviceSelected = ref(null);
const propertyInfo = ref({
  location: "",
  squareFootage: 0, // Initialize as a number
  notes: "",
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

const emit = defineEmits(["updateCart"]);

const handleEmailChecked = (data) => {
  userInfo.value.email = data.email;
  userInfo.value.name = data.name;
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
  };
  propertyInfoSubmitted.value = true;
};

const handlePropertyStatusSubmitted = (propertyStatus) => {
  // Handle the property status here
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

  // Check if the cart has add-ons after updating
  // if (hasAddOns.value) {
  //   showNextButton.value = true;
  //   // addOnSelectionStep.value = true; // Show the AddOnSelection component if there are add-ons
  // } else {
  //   showNextButton.value = true; // Hide if there are no add-ons
  // }
};

const handleAddOnToCart = (addOn) => {
  // Add the selected add-on to the cart
  cart.value.items.push(addOn);
  cart.value.totalPrice += parseFloat(addOn.fields.Price); // Update the total price
  cart.value.totalDuration += parseFloat(addOn.fields.Duration);
  showNextButton.value = true; // Show the next button if items are in the cart
};

const handleSlotSelected = (bookingData) => {
  canProceedToNextStep.value = true;
  console.log("Slot selected:", bookingData.selectedSlot);
};

const nextStep = () => {
  // Logic to move to the next step in your main form
  console.log("Proceeding to the next step");
};

watch(selectedProducts, (newVal) => {
  // Emit an updateCart event whenever the selected products change
  emit("updateCart", newVal);
});
</script>

<style scoped>
/* Global styles for the multi-step form */
</style>
