<template>
  <div class="upload-container">
    <h3>Upload Your Images</h3>
    <FormKit
      type="file"
      name="images"
      label="Choose your images"
      multiple
      accept="image/*"
      @input="handleFileUpload"
    />

    <div class="flex justify-between items-center w-full mt-4">
      <!-- Prev Step button aligned to the left -->
      <div>
        <FormKit
          type="button"
          label="Prev Step"
          @click="backToSelectOrderTypeStep"
          class="mr-auto"
        />
      </div>
      <div>
        <!-- Next Step button aligned to the right -->
        <FormKit type="submit" label="Next Step" class="ml-auto" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits } from "vue";
import axios from "axios";

const emit = defineEmits(["selectOrderTypeStep"]);
const selectedFiles = ref([]);
const dropboxToken = import.meta.env.VITE_DROPBOX_ACCESS_TOKEN;

const handleFileUpload = async (files) => {
  selectedFiles.value = files;
  if (selectedFiles.value.length === 0) {
    console.log("No files selected");
    return;
  }

  try {
    // Step 1: Upload images to Dropbox
    const uploadedUrls = await uploadToDropbox(Array.from(selectedFiles.value));
  } catch (error) {
    console.error("Error during the process:", error);
  }
};

const uploadToDropbox = async (files) => {
  const uploadedImageUrls = [];

  for (let file of files) {
    try {
      // Convert file to ArrayBuffer or Blob
      const response = await axios.post(
        "https://content.dropboxapi.com/2/files/upload",
        file, // Send the file directly
        {
          headers: {
            Authorization: `Bearer ${dropboxToken}`,
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

      //    After the file is uploaded, get a shareable link for it
      const fileLinkResponse = await axios.post(
        "https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings",
        {
          path: response.data.path_lower,
          settings: { requested_visibility: "public" },
        },
        {
          headers: {
            Authorization: `Bearer ${dropboxToken}`, // Replace with your Dropbox Access Token
            "Content-Type": "application/json",
          },
        }
      );

      // Add the shareable URL to the array
      uploadedImageUrls.push(
        fileLinkResponse.data.url.replace("?dl=0", "?raw=1")
      ); // Get a direct link to the image
      console.log(uploadedImageUrls);
    } catch (error) {
      console.error(
        "Error uploading to Dropbox:",
        error.response?.data || error.message
      );
    }
  }

  return uploadedImageUrls;
};

// const uploadToDropbox = async (files) => {
//   const uploadedImageUrls = [];

//   for (let file of files) {
//     const formData = new FormData();
//     formData.append("file", file);

//     try {
//       const response = await axios.post(
//         "https://content.dropboxapi.com/2/files/upload",
//         formData,
//         {
//           headers: {
//             Authorization: `Bearer ${dropboxToken}`,
//             "Dropbox-API-Arg": JSON.stringify({
//               path: `/digital-homes/virtual-staging/${file.name}`,
//               mode: "add",
//               autorename: true,
//               mute: false,
//             }),
//             "Content-Type": "application/octet-stream",
//           },
//         }
//       );

//       // After the file is uploaded, get a shareable link for it
//       const fileLinkResponse = await axios.post(
//         "https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings",
//         {
//           path: response.data.path_lower,
//           settings: { requested_visibility: "public" },
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${dropboxToken}`, // Replace with your Dropbox Access Token
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       // Add the shareable URL to the array
//       uploadedImageUrls.push(
//         fileLinkResponse.data.url.replace("?dl=0", "?raw=1")
//       ); // Get a direct link to the image
//       console.log(uploadedImageUrls);
//     } catch (error) {
//       console.error("Error uploading to Dropbox:", error);
//     }
//   }

//   return uploadedImageUrls;
// };

const backToSelectOrderTypeStep = () => {
  console.log("back button pressed");
  emit("selectOrderTypeStep");
};
</script>

<style scoped>
/* Add relevant styles */
</style>
