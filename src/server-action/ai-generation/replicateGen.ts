"use server";

import Replicate from "replicate";



const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});




export const replicate_nsfw_filter = async (detect_image:string) => {

    const output = await replicate.run(
        "falcons-ai/nsfw_image_detection:97116600cabd3037e5f22ca08ffcc33b92cfacebf7ccd3609e9c1d29e43d3a8d",
        {
          input: {
            image: detect_image
          }
        }
      );

    return output;
};