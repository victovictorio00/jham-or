// Single worker: serialize decoding while up to two transfers run in parallel.
let pending = Promise.resolve();
self.onmessage = ({ data }) => {
  pending = pending
    .then(async () => {
      const { id, file } = data;
      let bitmap;
      try {
        if (!self.createImageBitmap || !self.OffscreenCanvas)
          throw new Error("unsupported");
        bitmap = await createImageBitmap(file);
        if (bitmap.width * bitmap.height > 25000000) {
          self.postMessage({
            id,
            error: "La imagen supera los 25 megapíxeles.",
          });
          return;
        }
        const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
        const canvas = new OffscreenCanvas(
          Math.max(1, Math.round(bitmap.width * scale)),
          Math.max(1, Math.round(bitmap.height * scale)),
        );
        canvas
          .getContext("2d")
          .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const blob = await canvas.convertToBlob({
          type: "image/webp",
          quality: 0.82,
        });
        self.postMessage({ id, blob: blob.size < file.size ? blob : file });
      } catch {
        self.postMessage({ id, blob: file });
      } finally {
        bitmap?.close();
      }
    })
    .catch(() => {});
};
