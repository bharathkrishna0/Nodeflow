export async function sendFormData(
  type: string,
  data: string | File,
  filename: string,
  endpoint: string = "/sendfile",
): Promise<void> {
  try {
    const formData = new FormData();

    formData.append("type", type);
    formData.append("data", data);
    if (type === "text") {
      formData.append("filename", `${filename}.md`);
    } else {
      formData.append("filename", filename);
    }
    // console.log("appended data");

    const response = await fetch(endpoint, {
      method: "POST",
      body: formData, // No need to set Content-Type; fetch does it automatically for FormData
    });

    console.log(response);

    if (!response.ok) {
      console.log(" failed");
      const errorText = await response.text(); // Get error details from the server
      throw new Error(`HTTP error ${response.status}: ${errorText}`); // Throw an error with details
    }

    const returndata = await response.text(); // If the server sends back JSON
    console.log("File uploaded successfully:", returndata);
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}
