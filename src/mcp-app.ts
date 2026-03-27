import { App } from "@modelcontextprotocol/ext-apps";

// ── Element refs ──────────────────────────────────────────────────────────
const promptInput = document.getElementById("prompt-input") as HTMLTextAreaElement;
const aspectSelect = document.getElementById("aspect-select") as HTMLSelectElement;
const generateBtn = document.getElementById("generate-btn") as HTMLButtonElement;
const statusEl = document.getElementById("status") as HTMLDivElement;
const latestResult = document.getElementById("latest-result") as HTMLDivElement;
const latestImg = document.getElementById("latest-img") as HTMLImageElement;
const latestPromptLabel = document.getElementById("latest-prompt-label") as HTMLDivElement;
const galleryEl = document.getElementById("gallery") as HTMLDivElement;
const galleryEmpty = document.getElementById("gallery-empty") as HTMLDivElement;
const clearBtn = document.getElementById("clear-btn") as HTMLButtonElement;

// ── Gallery state ─────────────────────────────────────────────────────────
interface GalleryEntry {
  imageUrl: string;
  prompt: string;
  timestamp: number;
}

const gallery: GalleryEntry[] = [];

function renderGallery() {
  // Remove all items except the empty placeholder
  Array.from(galleryEl.querySelectorAll(".gallery-item")).forEach((el) =>
    el.remove()
  );

  if (gallery.length === 0) {
    galleryEmpty.style.display = "block";
    return;
  }

  galleryEmpty.style.display = "none";

  // Most recent first
  [...gallery].reverse().forEach((entry) => {
    const item = document.createElement("div");
    item.className = "gallery-item";

    const img = document.createElement("img");
    img.src = entry.imageUrl;
    img.alt = entry.prompt;
    img.loading = "lazy";

    const overlay = document.createElement("div");
    overlay.className = "gallery-overlay";
    overlay.textContent = entry.prompt;

    item.appendChild(img);
    item.appendChild(overlay);

    // Click to reload prompt
    item.addEventListener("click", () => {
      // Strip the trigger word prefix for editing
      const stripped = entry.prompt.replace(/^TA-TTT-OO-ME\s*/i, "");
      promptInput.value = stripped;
    });

    galleryEl.insertBefore(item, galleryEmpty);
  });
}

function setStatus(msg: string, isError = false) {
  statusEl.textContent = msg;
  statusEl.className = isError ? "error" : "";
}

// ── MCP App connection ────────────────────────────────────────────────────
const app = new App({ name: "Tattty 4 All Generator", version: "1.0.0" });

// Receive tool results from host (initial load or refreshes)
app.ontoolresult = (result) => {
  const text = result.content?.find((c) => c.type === "text")?.text;
  if (!text) return;

  try {
    const data = JSON.parse(text) as {
      status?: string;
      imageUrl?: string | null;
      prompt?: string;
      error?: string;
    };

    if (data.error) {
      setStatus(`Error: ${data.error}`, true);
      generateBtn.disabled = false;
      return;
    }

    if (data.status === "succeeded" && data.imageUrl) {
      // Show latest
      latestImg.src = data.imageUrl;
      latestPromptLabel.textContent = `Prompt: ${data.prompt ?? ""}`;
      latestResult.style.display = "block";

      // Add to gallery
      gallery.push({
        imageUrl: data.imageUrl,
        prompt: data.prompt ?? "",
        timestamp: Date.now(),
      });
      renderGallery();

      // Update model context so the LLM knows what was generated
      app
        .updateModelContext({
          content: [
            {
              type: "text",
              text: `Tattoo generated successfully. Image URL: ${data.imageUrl}. Prompt used: ${data.prompt}`,
            },
          ],
        })
        .catch(() => {});

      setStatus("✓ Generated!");
    } else if (data.status === "failed") {
      setStatus("Generation failed — try a different prompt.", true);
    }
  } catch {
    setStatus("Unexpected response from server.", true);
  }

  generateBtn.disabled = false;
};

// ── Generate button ───────────────────────────────────────────────────────
generateBtn.addEventListener("click", async () => {
  const prompt = promptInput.value.trim();
  const aspect_ratio = aspectSelect.value;

  generateBtn.disabled = true;
  setStatus("Generating… this takes ~10 seconds ⏳");

  try {
    await app.callServerTool({
      name: "generate_tattoo",
      arguments: { prompt, aspect_ratio },
    });
    // Result handled by ontoolresult above
  } catch (err) {
    setStatus(`Error: ${String(err)}`, true);
    generateBtn.disabled = false;
  }
});

// ── Clear gallery ─────────────────────────────────────────────────────────
clearBtn.addEventListener("click", () => {
  gallery.length = 0;
  latestResult.style.display = "none";
  renderGallery();
  setStatus("");
});

// ── Init ──────────────────────────────────────────────────────────────────
async function init() {
  try {
    await app.connect();
    setStatus("Ready — describe your tattoo and generate!");
  } catch {
    setStatus("Could not connect to MCP host.", true);
  }
}

init();
