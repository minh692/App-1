export const fileToBase64 = (file: File): Promise<{ base64Data: string; mimeType: string; }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const parts = result.split(',');
      if (parts.length !== 2) {
        return reject(new Error("Invalid data URL format"));
      }
      
      const meta = parts[0];
      const data = parts[1];
      
      const mimeMatch = meta.match(/:(.*?);/);
      if (!mimeMatch || mimeMatch.length < 2) {
          return reject(new Error("Could not determine MIME type from data URL"));
      }
      const mimeType = mimeMatch[1];
      
      resolve({ base64Data: data, mimeType });
    };
    reader.onerror = (error) => reject(error);
  });
};
