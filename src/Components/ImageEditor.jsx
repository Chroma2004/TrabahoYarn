import { useEffect, useRef, useState } from 'react';

import {
  Upload,
  Eraser,
  Download,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';

// ============================================================
// IMAGE EDITOR
// ============================================================

function ImageEditor() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [result, setResult] = useState('');

  const [color, setColor] = useState('#ffffff');
  const [tolerance, setTolerance] = useState(55);

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const inputRef = useRef(null);
  const canvasRef = useRef(null);
  const objectUrlRef = useRef('');

  // ==========================================================
  // CLEANUP
  // ==========================================================

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  // ==========================================================
  // UPLOAD
  // ==========================================================

  const uploadImage = (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select a valid image.');
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const url = URL.createObjectURL(selectedFile);

    objectUrlRef.current = url;

    setFile(selectedFile);
    setPreview(url);
    setResult('');
    setError('');

    canvasRef.current = null;
  };

  // ==========================================================
  // REMOVE BACKGROUND
  // ==========================================================

  const removeBackground = async () => {
    if (!file) return;

    setProcessing(true);
    setError('');

    try {
      const image = new Image();
      image.src = preview;

      await image.decode();

      const canvas = document.createElement('canvas');

      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      const context = canvas.getContext('2d', {
        willReadFrequently: true,
      });

      if (!context) {
        throw new Error('Canvas unavailable.');
      }

      context.drawImage(image, 0, 0);

      const imageData = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );

      const pixels = imageData.data;

      const red = parseInt(color.slice(1, 3), 16);
      const green = parseInt(color.slice(3, 5), 16);
      const blue = parseInt(color.slice(5, 7), 16);

      for (let i = 0; i < pixels.length; i += 4) {
        const distance = Math.sqrt(
          (pixels[i] - red) ** 2 +
          (pixels[i + 1] - green) ** 2 +
          (pixels[i + 2] - blue) ** 2
        );

        if (distance <= tolerance) {
          pixels[i + 3] = 0;
        } else if (distance < tolerance + 30) {
          pixels[i + 3] = Math.round(
            pixels[i + 3] *
              ((distance - tolerance) / 30)
          );
        }
      }

      context.putImageData(imageData, 0, 0);

      canvasRef.current = canvas;

      setResult(canvas.toDataURL('image/png'));
    } catch {
      setError('Unable to process this image.');
    } finally {
      setProcessing(false);
    }
  };

  // ==========================================================
  // DOWNLOAD
  // ==========================================================

  const downloadImage = () => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
      if (!blob) {
        setError('Download failed.');
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;

      link.download = `${
        file.name.replace(/\.[^.]+$/, '')
      }-transparent.png`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    }, 'image/png');
  };

  // ==========================================================
  // RESET
  // ==========================================================

  const reset = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = '';
    }

    setFile(null);
    setPreview('');
    setResult('');
    setError('');

    canvasRef.current = null;

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  // ==========================================================
  // CHECKERBOARD STYLE
  // ==========================================================

  const checkerboardStyle = {
    backgroundColor: '#ffffff',
    backgroundImage:
      'linear-gradient(45deg,#E5E5E5 25%,transparent 25%),linear-gradient(-45deg,#E5E5E5 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#E5E5E5 75%),linear-gradient(-45deg,transparent 75%,#E5E5E5 75%)',
    backgroundSize: '20px 20px',
    backgroundPosition:
      '0 0,0 10px,10px -10px,-10px 0',
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5 pb-8 text-[#191919]">

      {/* HEADER */}

      <div className="border-b border-[#D8C4AD] pb-5">

        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Image Studio
          <span className="text-[#F36B21]">.</span>
        </h2>

        <p className="mt-1 text-xs text-[#857665]">
          Remove solid-color backgrounds
        </p>

      </div>

      {/* MAIN PANEL */}

      <section className="rounded-xl border border-[#D8C4AD] bg-[#FAEBD7] p-4 sm:p-6">

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) =>
            uploadImage(event.target.files?.[0])
          }
        />

        {!file ? (
          <button
            type="button"
            onClick={() =>
              inputRef.current?.click()
            }
            className="flex min-h-[300px] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#D8C4AD] bg-[#F5E4CF] transition-colors hover:border-[#F36B21]"
          >

            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#F36B21]/10 text-[#F36B21]">
              <Upload size={23} />
            </div>

            <p className="mt-4 text-sm font-bold">
              Upload Image
            </p>

            <p className="mt-2 text-xs text-[#857665]">
              Click to select an image
            </p>

          </button>
        ) : (
          <div className="space-y-5">

            {/* TOOLBAR */}

            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#D8C4AD] pb-5">

              <div className="flex min-w-0 items-center gap-3">

                <ImageIcon
                  size={18}
                  className="shrink-0 text-[#176D70]"
                />

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {file.name}
                  </p>

                  <p className="mt-0.5 text-[11px] text-[#857665]">
                    Image loaded
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  inputRef.current?.click()
                }
                className="rounded-md border border-[#D8C4AD] px-3 py-2 text-xs font-semibold text-[#176D70] hover:bg-[#F1DFCA]"
              >
                Change Image
              </button>

            </div>

            {/* CONTROLS */}

            <div className="grid gap-5 rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] p-4 sm:grid-cols-[140px_minmax(0,1fr)]">

              {/* COLOR */}

              <div>
                <label className="mb-2 block text-xs font-semibold text-[#675C50]">
                  Remove Color
                </label>

                <input
                  type="color"
                  value={color}
                  onChange={(event) =>
                    setColor(event.target.value)
                  }
                  className="h-10 w-16 cursor-pointer rounded-md border border-[#D8C4AD] bg-transparent"
                />
              </div>

              {/* TOLERANCE */}

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#675C50]">
                    Tolerance
                  </label>

                  <span className="text-xs font-bold text-[#F36B21]">
                    {tolerance}
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="200"
                  value={tolerance}
                  onChange={(event) =>
                    setTolerance(
                      Number(event.target.value)
                    )
                  }
                  className="w-full accent-[#F36B21]"
                />
              </div>

            </div>

            {/* PREVIEW */}

            <div className="grid gap-4 md:grid-cols-2">

              {/* ORIGINAL */}

              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#857665]">
                  Original
                </p>

                <div className="flex h-[320px] items-center justify-center overflow-hidden rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] p-4">
                  <img
                    src={preview}
                    alt="Original"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>

              {/* RESULT */}

              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#857665]">
                  Result
                </p>

                <div
                  className="flex h-[320px] items-center justify-center overflow-hidden rounded-lg border border-[#D8C4AD] p-4"
                  style={checkerboardStyle}
                >
                  {result ? (
                    <img
                      src={result}
                      alt="Processed result"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <p className="rounded-md bg-white/90 px-3 py-2 text-xs text-[#857665]">
                      No result yet
                    </p>
                  )}
                </div>
              </div>

            </div>

            {/* ACTIONS */}

            <div className="flex flex-wrap gap-3 border-t border-[#D8C4AD] pt-5">

              <button
                type="button"
                onClick={removeBackground}
                disabled={processing}
                className="inline-flex items-center gap-2 rounded-lg bg-[#F36B21] px-5 py-3 text-xs font-bold text-white transition-colors hover:bg-[#DC5814] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Eraser size={16} />

                {processing
                  ? 'Processing...'
                  : 'Remove Background'}
              </button>

              {result && (
                <button
                  type="button"
                  onClick={downloadImage}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#176D70] px-5 py-3 text-xs font-bold text-white transition-colors hover:bg-[#10484A]"
                >
                  <Download size={16} />
                  Download PNG
                </button>
              )}

              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-lg border border-[#D8C4AD] px-5 py-3 text-xs font-semibold text-[#675C50] hover:bg-[#F1DFCA]"
              >
                <RefreshCw size={16} />
                Reset
              </button>

            </div>

          </div>
        )}

        {/* ERROR */}

        {error && (
          <p
            role="alert"
            className="mt-4 text-xs font-medium text-[#C7503E]"
          >
            {error}
          </p>
        )}

      </section>

      {/* FOOTER */}

      <p className="text-center text-xs text-[#857665]">
        Best suited for images with solid-color backgrounds.
      </p>

    </div>
  );
}

export default ImageEditor;