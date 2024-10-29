<template>
  <div>
    <h1 class="text-xl mb-4 font-['DM_Sans']">What's your email?</h1>
    <p class="text-l mb-4 font-['DM_Sans']">
      Note: Please use the same email every time.
    </p>
    <form @submit.prevent="checkEmail">
      <FormKit type="email" v-model="email" label="Email" required />

      <!-- Flex container for buttons with space between -->
      <div class="flex justify-between items-center w-full mt-4">
        <div>
          <!-- 'Prev Step' button aligned to the left -->
          <FormKit
            type="button"
            label="Prev Step"
            @click="backToFormStep"
            class="mr-auto"
          />
        </div>
        <div>
          <!-- 'Next Step' button aligned to the right -->
          <FormKit type="submit" label="Next Step" class="ml-auto" />
        </div>
      </div>

      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

// Set up the emit function for communicating with the parent component
const emit = defineEmits(["emailChecked"]);
const email = ref("");
const errorMessage = ref("");

const airtableBaseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
const agentTableName = import.meta.env.VITE_AGENT_TABLE_NAME;
const airtableToken = import.meta.env.VITE_AIRTABLE_TOKEN;

const checkEmail = async () => {
  try {
    const response = await axios.get(
      `https://api.airtable.com/v0/${airtableBaseId}/${agentTableName}`,
      {
        headers: { Authorization: `Bearer ${airtableToken}` },
        params: { filterByFormula: `Email='${email.value}'` },
      }
    );
    const records = response.data.records;
    const userName = records.length > 0 ? records[0].fields["Full Name"] : "";
    const userId = records.length > 0 ? records[0].id : "";
    const stripePaymentMethodID =
      records.length > 0 ? records[0].fields["Stripe Payment Method"] : "";
    emit("emailChecked", {
      email: email.value,
      name: userName,
      id: userId,
      paymentId: stripePaymentMethodID,
    });
  } catch (error) {
    console.error("Error checking email in Airtable:", error);
    console.log(error);
    errorMessage.value =
      "There was an error checking your email. Please try again later.";
  }
};

const backToFormStep = () => {
  emit("formStep");
};

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const emailParam = urlParams.get("email");
  if (emailParam) {
    email.value = emailParam;
    checkEmail(); // Call checkEmail to perform the email check in the background
  }
});
</script>

<style scoped>
/* Add styles specific to the email input step */
</style>
