"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
export type MediaItem = {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  name: string;
  alt: string;
  width: number;
  height: number;
  size: number;
};
type Task = {
  id: number;
  file: File;
  state: "Pendiente" | "Preparando" | "Subiendo" | "Guardada" | "Error";
  progress: number;
  error?: string;
};
export function MediaUpload({
  onUploaded,
}: {
  onUploaded?: (items: MediaItem[]) => void;
}) {
  const router = useRouter();
  const sequence = useRef(0);
  const [tasks, setTasks] = useState<Task[]>([]),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const worker = useRef<Worker | null>(null),
    callbacks = useRef(
      new Map<
        number,
        {
          resolve: (blob: Blob) => void;
          reject: (error: Error) => void;
          timer: ReturnType<typeof setTimeout>;
        }
      >(),
    );
  useEffect(() => {
    try {
      const instance = new Worker("/workers/image-optimizer.js");
      worker.current = instance;
      instance.onmessage = ({ data }) => {
        const callback = callbacks.current.get(data.id);
        if (!callback) return;
        clearTimeout(callback.timer);
        callbacks.current.delete(data.id);
        if (data.error) callback.reject(new Error(data.error));
        else callback.resolve(data.blob);
      };
      instance.onerror = () => {
        for (const callback of callbacks.current.values()) {
          clearTimeout(callback.timer);
          callback.reject(
            new Error("No se pudo preparar la imagen. Reintenta la subida."),
          );
        }
        callbacks.current.clear();
        instance.terminate();
        worker.current = null;
      };
    } catch {}
    return () => {
      worker.current?.terminate();
      for (const callback of callbacks.current.values())
        clearTimeout(callback.timer);
      callbacks.current.clear();
    };
  }, []);
  const update = (id: number, patch: Partial<Task>) =>
    setTasks((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  const prepare = (task: Task) =>
    new Promise<Blob>((resolve, reject) => {
      if (!worker.current) {
        resolve(task.file);
        return;
      }
      const timer = setTimeout(() => {
        callbacks.current.delete(task.id);
        resolve(task.file);
      }, 30000);
      callbacks.current.set(task.id, { resolve, reject, timer });
      worker.current.postMessage({ id: task.id, file: task.file });
    });
  const run = async (queue: Task[]) => {
    setBusy(true);
    setMessage("");
    let cursor = 0;
    const saved: MediaItem[] = [];
    let failed = 0;
    const upload = async () => {
      while (cursor < queue.length) {
        const task = queue[cursor++];
        try {
          update(task.id, {
            state: "Preparando",
            error: undefined,
            progress: 0,
          });
          if (
            !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(
              task.file.type,
            )
          )
            throw new Error("Usa JPG, PNG, WebP o AVIF.");
          if (task.file.size > 5 * 1024 * 1024)
            throw new Error("El máximo por imagen es 5 MB.");
          const blob = await prepare(task);
          update(task.id, { state: "Subiendo" });
          const result = await new Promise<MediaItem>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/api/admin/upload");
            xhr.timeout = 120000;
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable)
                update(task.id, {
                  progress: Math.round((event.loaded / event.total) * 100),
                });
            };
            xhr.onerror = () =>
              reject(new Error("Error de conexión. Reintenta esta imagen."));
            xhr.ontimeout = () =>
              reject(
                new Error("La subida tardó demasiado. Reintenta esta imagen."),
              );
            xhr.onload = () => {
              try {
                const data = JSON.parse(xhr.responseText);
                if (xhr.status >= 200 && xhr.status < 300) resolve(data);
                else
                  reject(
                    new Error(data.error || "No se pudo subir la imagen."),
                  );
              } catch {
                reject(new Error("No se pudo subir la imagen."));
              }
            };
            const form = new FormData();
            form.append(
              "file",
              new File([blob], task.file.name, { type: blob.type }),
            );
            xhr.send(form);
          });
          saved.push(result);
          update(task.id, { state: "Guardada", progress: 100 });
        } catch (error) {
          failed++;
          update(task.id, { state: "Error", error: (error as Error).message });
        }
      }
    };
    try {
      await Promise.all([upload(), upload()]);
      if (saved.length) {
        if (onUploaded) onUploaded(saved);
        else router.refresh();
      }
      setMessage(
        `${saved.length} ${saved.length === 1 ? "imagen guardada" : "imágenes guardadas"}.${failed ? ` ${failed} ${failed === 1 ? "no se pudo subir; puedes reintentarla" : "no se pudieron subir; puedes reintentarlas"}.` : ""}`,
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <form
      className="media-upload"
      onSubmit={(event) => {
        event.preventDefault();
        void run(tasks.filter((task) => task.state !== "Guardada"));
      }}
    >
      <label>
        Subir imágenes (hasta 20 fotos · JPG, PNG, WebP o AVIF · 5 MB por foto)
        <input
          type="file"
          name="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          disabled={busy}
          onChange={(event) => {
            const files = Array.from(event.target.files || []);
            if (files.length > 20) {
              setMessage("Selecciona hasta 20 imágenes por lote.");
              setTasks([]);
              event.target.value = "";
              return;
            }
            setMessage("");
            setTasks(
              files.map((file) => ({
                id: sequence.current++,
                file,
                state: "Pendiente",
                progress: 0,
              })),
            );
          }}
        />
      </label>
      <button
        className="button"
        disabled={busy || !tasks.some((task) => task.state !== "Guardada")}
      >
        <Upload size={17} />
        {busy
          ? "Subiendo imágenes…"
          : tasks.some((task) => task.state === "Error")
            ? "Reintentar pendientes"
            : "Subir imágenes"}
      </button>
      {tasks.length > 0 && (
        <ul className="upload-queue" aria-label="Progreso de imágenes">
          {tasks.map((task) => (
            <li key={task.id}>
              <span>{task.file.name}</span>
              <span>
                {task.state}
                {task.state === "Subiendo" ? ` ${task.progress}%` : ""}
              </span>
              {task.state === "Subiendo" && (
                <progress
                  max={100}
                  value={task.progress}
                  aria-label={`Progreso de ${task.file.name}`}
                />
              )}
              {task.error && <small role="alert">{task.error}</small>}
            </li>
          ))}
        </ul>
      )}
      {message && <p role="status">{message}</p>}
    </form>
  );
}
