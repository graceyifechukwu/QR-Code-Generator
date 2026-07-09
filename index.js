// Get the HTML elements the script needs to control.
const form = document.getElementById("qrForm");
const input = document.getElementById("urlInput");
const qrImage = document.getElementById("qrImage");
const previewText = document.getElementById("previewText");
const messageBox = document.getElementById("messageBox");
const downloadBtn = document.getElementById("downloadBtn");

// Stores the QR code as a PNG data URL so it can be shown and downloaded.
let currentDataUrl = "";

// Displays success or error messages under the preview area.
function showMessage(text, isError = false) {
  messageBox.textContent = text;
  messageBox.style.color = isError ? "#dc2626" : "#16a34a";
}

// Generates a QR code image from the entered URL using the loaded QR library.
function generateQrDataUrl(value) {
  if (!window.QRCode || !window.QRCode.CorrectLevel) {
    throw new Error("QRCode library failed to load.");
  }

  return new Promise((resolve, reject) => {
    try {
      // Draw the QR code in a temporary container so we can extract the image.
      const temp = document.createElement("div");
      new window.QRCode(temp, {
        text: value,
        width: 300,
        height: 300,
        correctLevel: window.QRCode.CorrectLevel.H,
      });

      // Prefer canvas output because it can be exported directly as PNG.
      const canvas = temp.querySelector("canvas");
      if (canvas) {
        resolve(canvas.toDataURL("image/png"));
        return;
      }

      // Some builds may render an image instead of a canvas.
      const image = temp.querySelector("img");
      if (image && image.src) {
        resolve(image.src);
        return;
      }

      reject(new Error("QR image output not found."));
    } catch (error) {
      reject(error);
    }
  });
}

// Runs when the user submits the form.
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const rawValue = input.value.trim();

  // Make sure the user entered something before continuing.
  if (!rawValue) {
    showMessage("Please enter a website link.", true);
    return;
  }

  // Add https:// if the user typed a link without a protocol.
  let value = rawValue;
  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`;
  }

  // Reject invalid URLs before trying to generate the QR code.
  try {
    new URL(value);
  } catch {
    showMessage("Please enter a valid URL.", true);
    return;
  }

  // Create the QR code, show it on the page, and enable download.
  try {
    currentDataUrl = await generateQrDataUrl(value);

    qrImage.src = currentDataUrl;
    qrImage.style.display = "block";
    previewText.style.display = "none";
    downloadBtn.disabled = false;
    showMessage("QR code generated successfully.");
  } catch (error) {
    const friendlyMessage =
      error && String(error.message || error).includes("failed to load")
        ? "QR library did not load. Please check your internet connection and refresh."
        : "Unable to generate QR code right now.";
    showMessage(friendlyMessage, true);
    console.error(error);
  }
});

// Downloads the generated QR code as a PNG file.
downloadBtn.addEventListener("click", () => {
  if (!currentDataUrl) return;

  // Create a temporary link and trigger a file download.
  const link = document.createElement("a");
  link.href = currentDataUrl;
  link.download = "qr-code.png";
  link.click();
});
