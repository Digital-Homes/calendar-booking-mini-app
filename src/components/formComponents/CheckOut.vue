<template>
  <div>
    <h2>This is the checkout form</h2>
    <h2>Selected Products: {{ productNamesString }}</h2>
    <h2>Location: {{ props.location }}</h2>
    <h2>Appointment: {{ props.appointment.time }}</h2>
    <h2>Date: {{ props.appointment.date }}</h2>
    <h2>Notes: {{ props.notes }}</h2>
    <h2>Photographer: {{ props.photographer }}</h2>
    <button @click="handleCheckout">Checkout</button>
  </div>
</template>

<script setup>
import { ref, defineProps, computed, defineEmits } from "vue";

const emit = defineEmits(["placeOrder"]);

// Define the props with their types
const props = defineProps({
  selectedProducts: {
    type: Array,
  },
  location: {
    type: String,
  },
  appointment: {
    type: Object,
  },
  notes: {
    type: String,
  },
  photographer: {
    type: String,
  },
});

// Compute product names string
const productNamesString = computed(() => {
  // Extracting product names and joining them as a string
  return props.selectedProducts
    .map((product) => product.fields.Name)
    .join(", ");
});

const handleCheckout = () => {
  emit("placeOrder", true); // Emit the placeOrder event with value true
};
</script>
