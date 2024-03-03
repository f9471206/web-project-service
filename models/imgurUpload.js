const { ImgurClient } = require("imgur");

async function uploadImage(file) {
  const client = new ImgurClient({
    clientId: process.env.IMGUR_CLIENT_ID,
    clientSecret: process.env.IMGUR_CLIENT_SECRET,
    refreshToken: process.env.IMGUR_REFRESH_TOKEN,
  });

  try {
    const response = await client.upload({
      image: file.buffer.toString("base64"),
      type: "base64",
      album: process.env.IMGUR_ALBUM,
    });
    return response.data;
  } catch (error) {
    console.error(error + "image err");
    throw new Error("An error occurred while uploading the image.");
  }
}

module.exports = uploadImage;
