import { useState } from 'react';

import {
  Upload,
  RefreshCw,
  FileImage,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

// ============================================================
// FILE CONVERTER
// ============================================================

function FileConverter() {
  const [files, setFiles] = useState([]);
  const [format, setFormat] = useState('png');
  const [quality, setQuality] = useState(90);

  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  // ==========================================================
  // FILE SELECTION
  // ==========================================================

  const selectFiles = (selectedFiles) => {
    const validFiles = Array.from(
      selectedFiles || []
    ).filter((file) =>
      file.type.startsWith('image/')
    );

    setFiles(validFiles);
    setMessage('');
  };

  // ==========================================================
  // CONVERSION
  // ==========================================================

  const convert = async () => {
    if (!files.length) return;

    setProcessing(true);
    setMessage('');

    const mimeTypes = {
      png: 'image/png',
      jpg: 'image/jpeg',
      webp: 'image/webp',
    };

    let completed = 0;

    try {
      for (const file of files) {
        const url = URL.createObjectURL(file);

        try {
          const image = new Image();
          image.src = url;

          await image.decode();

          const canvas = document.createElement('canvas');

          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;

          const context = canvas.getContext('2d');

          if (!context) {
            throw new Error('Canvas unavailable.');
          }

          if (format === 'jpg') {
            context.fillStyle = '#ffffff';

            context.fillRect(
              0,
              0,
              canvas.width,
              canvas.height
            );
          }

          context.drawImage(image, 0, 0);

          const blob = await new Promise(
            (resolve, reject) => {
              canvas.toBlob(
                (result) => {
                  if (result) {
                    resolve(result);
                  } else {
                    reject(
                      new Error('Conversion failed.')
                    );
                  }
                },
                mimeTypes[format],
                quality / 100
              );
            }
          );

          const downloadUrl =
            URL.createObjectURL(blob);

          const link =
            document.createElement('a');

          link.href = downloadUrl;

          link.download = `${
            file.name.replace(/\.[^.]+$/, '')
          }.${format}`;

          document.body.appendChild(link);
          link.click();
          link.remove();

          setTimeout(() => {
            URL.revokeObjectURL(downloadUrl);
          }, 1000);

          completed++;
        } finally {
          URL.revokeObjectURL(url);
        }
      }

      setMessage(
        `${completed} file(s) converted successfully.`
      );

      setMessageType('success');
    } catch {
      setMessage(
        `Conversion stopped after ${completed} file(s). Please try again.`
      );

      setMessageType('error');
    } finally {
      setProcessing(false);
    }
  };

  // ==========================================================
  // REMOVE FILE
  // ==========================================================

  const removeFile = (index) => {
    setFiles((previous) =>
      previous.filter(
        (_, fileIndex) => fileIndex !== index
      )
    );

    setMessage('');
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 pb-8 text-[#191919]">

      {/* HEADER */}

      <div className="border-b border-[#D8C4AD] pb-5">

        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          File Converter
          <span className="text-[#F36B21]">.</span>
        </h2>

        <p className="mt-1 text-xs text-[#857665]">
          Convert images to PNG, JPG, or WebP
        </p>

      </div>

      {/* MAIN PANEL */}

      <section className="rounded-xl border border-[#D8C4AD] bg-[#FAEBD7] p-4 sm:p-6">

        {/* UPLOAD */}

        <label className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#D8C4AD] bg-[#F5E4CF] px-4 text-center transition-colors hover:border-[#F36B21]">

          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#F36B21]/10 text-[#F36B21]">
            <Upload size={23} />
          </div>

          <p className="mt-4 text-sm font-bold">
            Choose Images
          </p>

          <p className="mt-2 text-xs text-[#857665]">
            Select one or multiple files
          </p>

          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => {
              selectFiles(event.target.files);

              event.target.value = '';
            }}
          />

        </label>

        {/* SELECTED FILES */}

        {files.length > 0 && (
          <div className="mt-6 space-y-5">

            {/* FILE LIST */}

            <div className="overflow-hidden rounded-lg border border-[#D8C4AD]">

              <div className="flex items-center gap-2 border-b border-[#D8C4AD] bg-[#F5E4CF] px-4 py-3">

                <FileImage
                  size={17}
                  className="text-[#176D70]"
                />

                <p className="text-xs font-semibold">
                  Selected Files ({files.length})
                </p>

              </div>

              <div className="max-h-[200px] overflow-y-auto">

                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between gap-3 border-b border-[#D8C4AD] px-4 py-3 last:border-b-0"
                  >

                    <div className="flex min-w-0 items-center gap-3">

                      <FileImage
                        size={16}
                        className="shrink-0 text-[#857665]"
                      />

                      <p className="truncate text-xs text-[#675C50]">
                        {file.name}
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeFile(index)
                      }
                      className="shrink-0 rounded-md p-1.5 text-[#857665] hover:bg-[#C7503E]/10 hover:text-[#C7503E]"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X size={15} />
                    </button>

                  </div>
                ))}

              </div>
            </div>

            {/* FORMAT */}

            <div>

              <p className="mb-3 text-xs font-semibold text-[#675C50]">
                Convert To
              </p>

              <div className="flex flex-wrap gap-2">

                {['png', 'jpg', 'webp'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setFormat(item)
                    }
                    className={`min-w-[85px] rounded-lg border px-5 py-2.5 text-xs font-bold uppercase transition-colors ${
                      format === item
                        ? 'border-[#F36B21] bg-[#F36B21] text-white'
                        : 'border-[#D8C4AD] bg-[#F5E4CF] text-[#675C50] hover:border-[#F36B21]'
                    }`}
                  >
                    {item}
                  </button>
                ))}

              </div>
            </div>

            {/* QUALITY */}

            {format !== 'png' && (
              <div className="rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] p-4">

                <div className="mb-3 flex items-center justify-between">

                  <label className="text-xs font-semibold text-[#675C50]">
                    Image Quality
                  </label>

                  <span className="text-xs font-bold text-[#F36B21]">
                    {quality}%
                  </span>

                </div>

                <input
                  type="range"
                  min="10"
                  max="100"
                  value={quality}
                  onChange={(event) =>
                    setQuality(
                      Number(event.target.value)
                    )
                  }
                  className="w-full accent-[#F36B21]"
                />

              </div>
            )}

            {/* CONVERT BUTTON */}

            <button
              type="button"
              onClick={convert}
              disabled={processing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#F36B21] py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#DC5814] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={
                  processing ? 'animate-spin' : ''
                }
              />

              {processing
                ? 'Converting...'
                : 'Convert Images'}
            </button>

          </div>
        )}

        {/* STATUS */}

        {message && (
          <div
            role="status"
            className={`mt-5 flex items-center gap-2 rounded-lg border px-4 py-3 text-xs font-medium ${
              messageType === 'error'
                ? 'border-[#C7503E]/30 bg-[#C7503E]/10 text-[#C7503E]'
                : 'border-[#176D70]/20 bg-[#176D70]/10 text-[#176D70]'
            }`}
          >
            {messageType === 'error' ? (
              <AlertCircle size={17} />
            ) : (
              <CheckCircle2 size={17} />
            )}

            {message}
          </div>
        )}

      </section>

    </div>
  );
}

export default FileConverter;