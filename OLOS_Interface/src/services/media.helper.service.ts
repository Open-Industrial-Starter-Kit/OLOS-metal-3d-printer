/**
 * @description Fetches a file from a given media URL and converts it into a File object.
 * @param mediaUrl The URL of the media file to be fetched.
 * @param fileName The desired name for the created File object.
 * @returns A Promise that resolves to a File object.
 */
export const fileFromMediaUrl = async (mediaUrl: string, fileName: string) => {
  const response = await fetch(mediaUrl);

  const blob = await response.blob();
  const fileType = blob.type;

  return new File([blob], fileName, { type: fileType });
};
