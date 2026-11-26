import { useState, useRef, useEffect } from 'react';

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import JSZip from 'jszip';

import {
  UploadCloud,
  Image,
  Video,
  FileArchive,
  Download,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  Settings2,
  HardDrive,
  ArrowRight,
  ShieldCheck,
  File,
  Minimize2,
  RefreshCw,
} from 'lucide-react';

// ============================================================
// CONSTANTS
// ============================================================

const IMAGE_FORMATS = [
  { label: 'WebP', value: 'image/webp', extension: 'webp' },
  { label: 'JPG', value: 'image/jpeg', extension: 'jpg' },
  { label: 'PNG', value: 'image/png', extension: 'png' },
];

const IMAGE_RESOLUTIONS = [
  { label: 'Original', value: 'original' },
  { label: '1920px', value: '1920' },
  { label: '1280px', value: '1280' },
  { label: '1080px', value: '1080' },
  { label: '720px', value: '720' },
  { label: '480px', value: '480' },
];

const VIDEO_RESOLUTIONS = [
  { label: 'Original', value: 'original' },
  { label: '1080p', value: '1080' },
  { label: '720p', value: '720' },
  { label: '480p', value: '480' },
  { label: '360p', value: '360' },
];

const VIDEO_PRESETS = [
  { name: 'High Quality', crf: 20, audioBitrate: '128k' },
  { name: 'Balanced', crf: 26, audioBitrate: '96k' },
  { name: 'Small File', crf: 32, audioBitrate: '64k' },
  { name: 'Maximum', crf: 38, audioBitrate: '48k' },
];

const IMAGE_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'bmp',
  'avif',
];

const VIDEO_EXTENSIONS = [
  'mp4',
  'mov',
  'webm',
  'avi',
  'mkv',
  'm4v',
];

const MAX_VIDEO_SIZE = 250 * 1024 * 1024;

const panelClass =
  'rounded-xl border border-[#D8C4AD] bg-[#FAEBD7]';

const inputClass =
  'w-full rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] px-3 py-2.5 text-xs font-medium outline-none focus:border-[#F36B21] disabled:opacity-50';

const labelClass =
  'mb-2 block text-[11px] font-semibold text-[#675C50]';

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-[#F36B21] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#DC5814] disabled:cursor-not-allowed disabled:opacity-40';

const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-[#D8C4AD] px-3 py-2 text-xs font-medium text-[#857665] transition-colors hover:bg-[#F5E4CF] disabled:opacity-40';

// ============================================================
// HELPERS
// ============================================================

function formatFileSize(bytes = 0) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];

  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  return `${(
    bytes / Math.pow(1024, index)
  ).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function getFileExtension(filename = '') {
  return filename.split('.').pop()?.toLowerCase() || '';
}

function getFileName(filename = '') {
  return filename.replace(/\.[^/.]+$/, '');
}

function getFileType(file) {
  const extension = getFileExtension(file.name);

  if (IMAGE_EXTENSIONS.includes(extension)) {
    return 'image';
  }

  if (VIDEO_EXTENSIONS.includes(extension)) {
    return 'video';
  }

  return null;
}

function getReduction(originalSize, compressedSize) {
  if (!originalSize) return 0;

  return Math.round(
    ((originalSize - compressedSize) / originalSize) * 100
  );
}

function getReductionLabel(reduction) {
  if (reduction > 0) {
    return `${reduction}% smaller`;
  }

  if (reduction < 0) {
    return `${Math.abs(reduction)}% larger`;
  }

  return 'No reduction';
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);

  anchor.click();
  anchor.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 30000);
}

function getUniqueFilename(filename, usedNames) {
  let candidate = filename;
  let counter = 1;

  const extension = getFileExtension(filename);
  const base = getFileName(filename);

  while (usedNames.has(candidate)) {
    candidate = `${base}_${counter}.${extension}`;
    counter += 1;
  }

  usedNames.add(candidate);

  return candidate;
}

// ============================================================
// IMAGE COMPRESSION
// ============================================================

async function compressImage(
  file,
  { quality, format, resolution }
) {
  const objectURL = URL.createObjectURL(file);

  let canvas;

  try {
    const image = await new Promise((resolve, reject) => {
      const element = new window.Image();

      element.onload = () => resolve(element);

      element.onerror = () =>
        reject(new Error('Unable to open image.'));

      element.src = objectURL;
    });

    let width = image.naturalWidth;
    let height = image.naturalHeight;

    if (!width || !height) {
      throw new Error('Invalid image dimensions.');
    }

    if (resolution !== 'original') {
      const maxDimension = Number(resolution);
      const largestDimension = Math.max(width, height);

      if (largestDimension > maxDimension) {
        const scale = maxDimension / largestDimension;

        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));
      }
    }

    canvas = document.createElement('canvas');

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Canvas is unavailable.');
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    if (format === 'image/jpeg') {
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, width, height);
    }

    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (!result) {
            reject(new Error('Image compression failed.'));
            return;
          }

          resolve(result);
        },
        format,
        quality / 100
      );
    });

    const outputFormat = IMAGE_FORMATS.find(
      (item) => item.value === blob.type
    );

    return {
      blob,
      name: `${getFileName(file.name)}_compressed.${
        outputFormat?.extension || 'png'
      }`,
      width,
      height,
    };
  } finally {
    URL.revokeObjectURL(objectURL);

    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className={`${panelClass} flex min-w-0 items-center gap-3 p-3 sm:p-4`}>

      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{
          color,
          backgroundColor: `${color}15`,
        }}
      >
        <Icon size={17} strokeWidth={1.8} />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] text-[#857665]">
          {label}
        </p>

        <p
          className="mt-0.5 truncate text-sm font-bold sm:text-base"
          style={{ color }}
        >
          {value}
        </p>
      </div>

    </div>
  );
}

// ============================================================
// SELECT FIELD
// ============================================================

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled,
}) {
  return (
    <label className="block">

      <span className={labelClass}>
        {label}
      </span>

      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

    </label>
  );
}

// ============================================================
// TOGGLE
// ============================================================

function Toggle({
  label,
  checked,
  onChange,
  disabled,
  title,
}) {
  return (
    <label
      title={title}
      className="flex cursor-pointer items-center justify-between gap-3"
    >

      <span className="text-xs font-medium text-[#675C50]">
        {label}
      </span>

      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />

      <span
        className="
          relative h-5 w-9 shrink-0 rounded-full
          bg-[#D8C4AD] transition-colors
          after:absolute after:left-0.5 after:top-0.5
          after:h-4 after:w-4 after:rounded-full
          after:bg-white after:transition-transform
          peer-checked:bg-[#176D70]
          peer-checked:after:translate-x-4
          peer-disabled:opacity-40
          peer-focus-visible:ring-2
          peer-focus-visible:ring-[#F36B21]
        "
      />

    </label>
  );
}

// ============================================================
// FILE ROW
// ============================================================

function FileRow({
  item,
  onRemove,
  onDownload,
  disabled,
}) {
  const isImage = item.type === 'image';
  const Icon = isImage ? Image : Video;

  const completed =
    item.status === 'completed' && item.output;

  const reduction = completed
    ? getReduction(item.file.size, item.output.blob.size)
    : 0;

  return (
    <div className="border-b border-[#D8C4AD] px-4 py-3 last:border-b-0">

      <div className="flex min-w-0 items-center gap-3">

        {/* PREVIEW */}

        <div
          className={`
            flex h-11 w-11 shrink-0 items-center
            justify-center overflow-hidden rounded-lg
            ${
              isImage
                ? 'bg-[#FCE0CA] text-[#A94D19]'
                : 'bg-[#E8DDF8] text-[#7651A8]'
            }
          `}
        >
          {isImage && item.previewURL ? (
            <img
              src={item.previewURL}
              alt={item.file.name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <Icon size={20} />
          )}
        </div>

        {/* FILE INFO */}

        <div className="min-w-0 flex-1">

          <p
            title={item.file.name}
            className="truncate text-xs font-semibold"
          >
            {item.file.name}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-[#857665]">

            <span>
              {formatFileSize(item.file.size)}
            </span>

            {completed && (
              <>
                <ArrowRight size={11} />

                <span
                  className={`font-semibold ${
                    reduction < 0
                      ? 'text-[#C7503E]'
                      : 'text-[#176D70]'
                  }`}
                >
                  {formatFileSize(item.output.blob.size)}
                </span>
              </>
            )}

            {completed && item.output.width && (
              <span className="hidden sm:inline">
                · {item.output.width} × {item.output.height}
              </span>
            )}

          </div>

          {completed && (
            <p
              className={`mt-1 text-[10px] font-medium sm:hidden ${
                reduction < 0
                  ? 'text-[#C7503E]'
                  : 'text-[#176D70]'
              }`}
            >
              {item.output.keptOriginal
                ? 'Original retained'
                : getReductionLabel(reduction)}
            </p>
          )}

        </div>

        {/* STATUS */}

        <div className="hidden shrink-0 sm:block">

          {item.status === 'pending' && (
            <span className="text-[10px] text-[#857665]">
              Ready
            </span>
          )}

          {item.status === 'compressing' && (
            <LoaderCircle
              size={15}
              className="animate-spin text-[#F36B21]"
            />
          )}

          {completed && (
            <span
              className={`rounded-md px-2 py-1 text-[10px] font-semibold ${
                reduction < 0
                  ? 'bg-[#C7503E]/10 text-[#C7503E]'
                  : 'bg-[#D6F0EB] text-[#176D70]'
              }`}
            >
              {item.output.keptOriginal
                ? 'Original retained'
                : getReductionLabel(reduction)}
            </span>
          )}

          {item.status === 'error' && (
            <AlertCircle
              size={15}
              className="text-[#C7503E]"
            />
          )}

        </div>

        {/* ACTIONS */}

        <div className="flex shrink-0 items-center gap-1">

          {completed && (
            <button
              type="button"
              onClick={() => onDownload(item)}
              title="Download"
              aria-label={`Download ${item.file.name}`}
              className="rounded-md bg-[#D6F0EB] p-2 text-[#176D70] hover:bg-[#B8E4DC]"
            >
              <Download size={15} />
            </button>
          )}

          <button
            type="button"
            disabled={disabled}
            onClick={() => onRemove(item.id)}
            title="Remove"
            aria-label={`Remove ${item.file.name}`}
            className="rounded-md p-2 text-[#857665] hover:bg-[#C7503E]/10 hover:text-[#C7503E] disabled:opacity-30"
          >
            <Trash2 size={15} />
          </button>

        </div>

      </div>

      {/* PROGRESS */}

      {item.status === 'compressing' && (
        <div className="mt-3">

          <div className="mb-1.5 flex items-center justify-between text-[10px] text-[#857665]">

            <span>
              {item.message || 'Compressing...'}
            </span>

            <span>
              {Math.round(item.progress || 0)}%
            </span>

          </div>

          <div
            role="progressbar"
            aria-label="Compression progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(item.progress || 0)}
            className="h-1 overflow-hidden rounded-full bg-[#E6D3BD]"
          >

            <div
              className="h-full rounded-full bg-[#F36B21] transition-all duration-300"
              style={{
                width: `${item.progress || 0}%`,
              }}
            />

          </div>

        </div>
      )}

      {/* ERROR */}

      {item.status === 'error' && (
        <div className="mt-2 flex items-start gap-1.5 text-[10px] text-[#C7503E]">

          <AlertCircle
            size={12}
            className="mt-0.5 shrink-0"
          />

          {item.error || 'Compression failed.'}

        </div>
      )}

    </div>
  );
}

// ============================================================
// FILE COMPRESSOR
// ============================================================

function FileCompressor() {
  const inputRef = useRef(null);

  const ffmpegRef = useRef(null);
  const ffmpegLoadedRef = useRef(false);

  const previewURLsRef = useRef(new Set());

  const processingRef = useRef(false);
  const mountedRef = useRef(true);

  const [activeTab, setActiveTab] = useState('image');

  const [files, setFiles] = useState([]);
  const [notice, setNotice] = useState('');

  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoadingEngine, setIsLoadingEngine] = useState(false);

  // IMAGE SETTINGS

  const [imageQuality, setImageQuality] = useState(75);

  const [imageFormat, setImageFormat] =
    useState('image/webp');

  const [imageResolution, setImageResolution] =
    useState('original');

  // VIDEO SETTINGS

  const [videoPreset, setVideoPreset] =
    useState('Balanced');

  const [videoResolution, setVideoResolution] =
    useState('720');

  const [removeAudio, setRemoveAudio] =
    useState(false);

  const [keepSmaller, setKeepSmaller] =
    useState(true);

  // ==========================================================
  // CLEANUP
  // ==========================================================

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      previewURLsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });

      previewURLsRef.current.clear();

      if (ffmpegRef.current) {
        try {
          ffmpegRef.current.terminate();
        } catch {
          // Already terminated.
        }
      }

      ffmpegRef.current = null;
      ffmpegLoadedRef.current = false;
    };
  }, []);

  // ==========================================================
  // DERIVED DATA
  // ==========================================================

  const visibleFiles = files.filter(
    (item) => item.type === activeTab
  );

  const completedFiles = visibleFiles.filter(
    (item) =>
      item.status === 'completed' && item.output
  );

  const pendingFiles = visibleFiles.filter(
    (item) =>
      item.status === 'pending' ||
      item.status === 'error'
  );

  const totalOriginalSize = visibleFiles.reduce(
    (total, item) => total + item.file.size,
    0
  );

  const completedOriginalSize = completedFiles.reduce(
    (total, item) => total + item.file.size,
    0
  );

  const totalCompressedSize = completedFiles.reduce(
    (total, item) => total + item.output.blob.size,
    0
  );

  const totalSaved = Math.max(
    0,
    completedOriginalSize - totalCompressedSize
  );

  const totalReduction = getReduction(
    completedOriginalSize,
    totalCompressedSize
  );

  const busy = isCompressing || isDownloading;

  // ==========================================================
  // UPDATE FILE
  // ==========================================================

  const updateFile = (id, updates) => {
    if (!mountedRef.current) return;

    setFiles((previous) =>
      previous.map((item) =>
        item.id === id
          ? { ...item, ...updates }
          : item
      )
    );
  };

  // ==========================================================
  // ADD FILES
  // ==========================================================

  const addFiles = (incomingFiles) => {
    if (busy || processingRef.current) return;

    const newFiles = [];
    const errors = [];

    Array.from(incomingFiles || []).forEach((file) => {
      const type = getFileType(file);

      if (!type) {
        errors.push(`${file.name}: Unsupported format.`);
        return;
      }

      if (!file.size) {
        errors.push(`${file.name}: Empty file.`);
        return;
      }

      if (type !== activeTab) {
        errors.push(
          `${file.name}: Select the ${
            type === 'image' ? 'Images' : 'Videos'
          } tab.`
        );

        return;
      }

      if (
        type === 'video' &&
        file.size > MAX_VIDEO_SIZE
      ) {
        errors.push(`${file.name}: Exceeds 250 MB.`);
        return;
      }

      let previewURL = null;

      if (type === 'image') {
        previewURL = URL.createObjectURL(file);
        previewURLsRef.current.add(previewURL);
      }

      newFiles.push({
        id:
          globalThis.crypto?.randomUUID?.() ||
          `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        type,
        previewURL,
        status: 'pending',
        progress: 0,
        output: null,
        error: '',
        message: '',
      });
    });

    if (newFiles.length) {
      setFiles((previous) => [
        ...previous,
        ...newFiles,
      ]);
    }

    setNotice(errors.join('\n'));

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  // ==========================================================
  // REMOVE FILE
  // ==========================================================

  const removeFile = (id) => {
    if (busy) return;

    const item = files.find(
      (file) => file.id === id
    );

    if (item?.previewURL) {
      URL.revokeObjectURL(item.previewURL);

      previewURLsRef.current.delete(
        item.previewURL
      );
    }

    setFiles((previous) =>
      previous.filter((file) => file.id !== id)
    );
  };

  // ==========================================================
  // CLEAR FILES
  // ==========================================================

  const clearFiles = () => {
    if (busy) return;

    visibleFiles.forEach((item) => {
      if (item.previewURL) {
        URL.revokeObjectURL(item.previewURL);

        previewURLsRef.current.delete(
          item.previewURL
        );
      }
    });

    setFiles((previous) =>
      previous.filter(
        (item) => item.type !== activeTab
      )
    );

    setNotice('');
  };

  // ==========================================================
  // RESET COMPRESSION
  // ==========================================================

  const resetResults = () => {
    if (busy) return;

    setFiles((previous) =>
      previous.map((item) =>
        item.type === activeTab
          ? {
              ...item,
              status: 'pending',
              progress: 0,
              output: null,
              error: '',
              message: '',
            }
          : item
      )
    );

    setNotice('');
  };

  // ==========================================================
  // LOAD FFMPEG
  // ==========================================================

  const loadFFmpeg = async () => {
    if (
      ffmpegLoadedRef.current &&
      ffmpegRef.current
    ) {
      return ffmpegRef.current;
    }

    setIsLoadingEngine(true);

    const ffmpeg = new FFmpeg();

    ffmpegRef.current = ffmpeg;

    const baseURL =
      'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm';

    let coreURL;
    let wasmURL;

    try {
      coreURL = await toBlobURL(
        `${baseURL}/ffmpeg-core.js`,
        'text/javascript'
      );

      if (!mountedRef.current) {
        throw new Error('Compressor closed.');
      }

      wasmURL = await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        'application/wasm'
      );

      if (!mountedRef.current) {
        throw new Error('Compressor closed.');
      }

      await ffmpeg.load({
        coreURL,
        wasmURL,
      });

      ffmpegLoadedRef.current = true;

      return ffmpeg;
    } catch {
      ffmpegLoadedRef.current = false;

      try {
        ffmpeg.terminate();
      } catch {
        // Already terminated.
      }

      ffmpegRef.current = null;

      throw new Error(
        'Unable to load video engine. Check your connection.'
      );
    } finally {
      if (coreURL) {
        URL.revokeObjectURL(coreURL);
      }

      if (wasmURL) {
        URL.revokeObjectURL(wasmURL);
      }

      if (mountedRef.current) {
        setIsLoadingEngine(false);
      }
    }
  };

  // ==========================================================
  // VIDEO COMPRESSION
  // ==========================================================

  const compressVideo = async (item) => {
    updateFile(item.id, {
      progress: 0,
      message: 'Loading engine...',
    });

    const ffmpeg = await loadFFmpeg();

    const extension = getFileExtension(item.file.name);

    const inputName = `input_${item.id}.${extension}`;
    const outputName = `output_${item.id}.mp4`;

    const preset =
      VIDEO_PRESETS.find(
        (item) => item.name === videoPreset
      ) || VIDEO_PRESETS[1];

    const handleProgress = ({ progress }) => {
      if (!Number.isFinite(progress)) return;

      updateFile(item.id, {
        progress: Math.max(
          0,
          Math.min(99, progress * 100)
        ),
        message: 'Compressing...',
      });
    };

    ffmpeg.on('progress', handleProgress);

    try {
      updateFile(item.id, {
        message: 'Preparing...',
      });

      await ffmpeg.writeFile(
        inputName,
        await fetchFile(item.file)
      );

      const args = [
        '-y',
        '-i',
        inputName,
        '-map',
        '0:v:0',
      ];

      if (!removeAudio) {
        args.push('-map', '0:a:0?');
      }

      // RESOLUTION

      if (videoResolution !== 'original') {
        args.push(
          '-vf',
          `scale=-2:trunc(min(ih\\,${videoResolution})/2)*2`
        );
      } else {
        args.push(
          '-vf',
          'scale=trunc(iw/2)*2:trunc(ih/2)*2'
        );
      }

      // VIDEO ENCODING

      args.push(
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        String(preset.crf),
        '-pix_fmt',
        'yuv420p',
        '-threads',
        '1'
      );

      // AUDIO

      if (removeAudio) {
        args.push('-an');
      } else {
        args.push(
          '-c:a',
          'aac',
          '-b:a',
          preset.audioBitrate
        );
      }

      args.push(
        '-map_metadata',
        '-1',
        '-movflags',
        '+faststart',
        outputName
      );

      updateFile(item.id, {
        message: 'Compressing...',
      });

      const exitCode = await ffmpeg.exec(args);

      if (exitCode !== 0) {
        throw new Error(
          'Video encoding failed. Unsupported codec or format.'
        );
      }

      const data = await ffmpeg.readFile(outputName);

      if (!(data instanceof Uint8Array)) {
        throw new Error('Invalid video output.');
      }

      const blob = new Blob(
        [new Uint8Array(data)],
        { type: 'video/mp4' }
      );

      if (!blob.size) {
        throw new Error('Empty video output.');
      }

      return {
        blob,
        name: `${getFileName(item.file.name)}_compressed.mp4`,
      };
    } finally {
      ffmpeg.off('progress', handleProgress);

      try {
        await ffmpeg.deleteFile(inputName);
      } catch {
        // File unavailable.
      }

      try {
        await ffmpeg.deleteFile(outputName);
      } catch {
        // File unavailable.
      }
    }
  };

  // ==========================================================
  // COMPRESS FILES
  // ==========================================================

  const compressFiles = async () => {
    if (
      processingRef.current ||
      !pendingFiles.length
    ) {
      return;
    }

    processingRef.current = true;

    setIsCompressing(true);
    setNotice('');

    try {
      for (const item of pendingFiles) {
        if (!mountedRef.current) break;

        updateFile(item.id, {
          status: 'compressing',
          progress: 0,
          error: '',
          output: null,
          message: 'Preparing...',
        });

        try {
          let output;

          if (item.type === 'image') {
            updateFile(item.id, {
              progress: 30,
              message: 'Compressing...',
            });

            output = await compressImage(
              item.file,
              {
                quality: imageQuality,
                format: imageFormat,
                resolution: imageResolution,
              }
            );
          } else {
            output = await compressVideo(item);
          }

          if (
            keepSmaller &&
            output.blob.size >= item.file.size
          ) {
            output = {
              blob: item.file,
              name: item.file.name,
              keptOriginal: true,
            };
          }

          updateFile(item.id, {
            status: 'completed',
            progress: 100,
            output,
            message: '',
          });
        } catch (error) {
          updateFile(item.id, {
            status: 'error',
            progress: 0,
            error:
              error.message || 'Compression failed.',
          });
        }
      }
    } finally {
      processingRef.current = false;

      if (mountedRef.current) {
        setIsCompressing(false);
      }
    }
  };

  // ==========================================================
  // DOWNLOAD
  // ==========================================================

  const downloadFile = (item) => {
    if (!item.output?.blob) return;

    downloadBlob(
      item.output.blob,
      item.output.name
    );
  };

  const downloadAll = async () => {
    if (!completedFiles.length || busy) return;

    setIsDownloading(true);

    try {
      if (completedFiles.length === 1) {
        downloadFile(completedFiles[0]);
        return;
      }

      const zip = new JSZip();
      const usedNames = new Set();

      completedFiles.forEach((item) => {
        const filename = getUniqueFilename(
          item.output.name,
          usedNames
        );

        zip.file(filename, item.output.blob);
      });

      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'STORE',
      });

      if (mountedRef.current) {
        downloadBlob(
          blob,
          `compressed_${activeTab}s.zip`
        );
      }
    } catch {
      if (mountedRef.current) {
        setNotice(
          'ZIP creation failed. Download files individually.'
        );
      }
    } finally {
      if (mountedRef.current) {
        setIsDownloading(false);
      }
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1600px] space-y-4 pb-8 text-[#191919]">

      {/* TABS */}

      <div className="flex flex-wrap items-center justify-between gap-3">

        <div className="inline-flex gap-1 rounded-lg border border-[#D8C4AD] bg-[#FAEBD7] p-1">

          {[
            {
              id: 'image',
              label: 'Images',
              icon: Image,
            },
            {
              id: 'video',
              label: 'Videos',
              icon: Video,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                disabled={busy}
                aria-pressed={selected}
                onClick={() => {
                  setActiveTab(tab.id);
                  setNotice('');
                }}
                className={`
                  flex items-center justify-center gap-2
                  rounded-md px-5 py-2.5
                  text-xs font-semibold transition-colors
                  disabled:opacity-50
                  ${
                    selected
                      ? 'bg-[#F36B21] text-white'
                      : 'text-[#857665] hover:bg-[#F5E4CF]'
                  }
                `}
              >
                <Icon size={15} />

                {tab.label}

              </button>
            );
          })}

        </div>

        <div
          title="Files are processed locally in your browser."
          className="flex items-center gap-1.5 text-[10px] font-medium text-[#176D70]"
        >
          <ShieldCheck size={14} />
          Local Processing
        </div>

      </div>

      {/* STATISTICS */}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">

        <StatCard
          icon={File}
          label="Files"
          value={visibleFiles.length}
          color="#A94D19"
        />

        <StatCard
          icon={HardDrive}
          label="Original"
          value={formatFileSize(totalOriginalSize)}
          color="#7651A8"
        />

        <StatCard
          icon={FileArchive}
          label="Compressed"
          value={formatFileSize(totalCompressedSize)}
          color="#176D70"
        />

        <StatCard
          icon={Minimize2}
          label="Saved"
          value={formatFileSize(totalSaved)}
          color="#397B49"
        />

      </div>

      {/* WORKSPACE */}

      <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">

        {/* LEFT COLUMN */}

        <div className="min-w-0 space-y-4">

          {/* UPLOAD */}

          <section className={`${panelClass} p-3`}>

            <div
              onDragOver={(event) => {
                event.preventDefault();

                if (!busy) {
                  setIsDragging(true);
                }
              }}
              onDragLeave={(event) => {
                if (
                  !event.currentTarget.contains(
                    event.relatedTarget
                  )
                ) {
                  setIsDragging(false);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();

                setIsDragging(false);

                addFiles(event.dataTransfer.files);
              }}
              className={`
                flex min-h-[190px] flex-col
                items-center justify-center
                rounded-lg border border-dashed
                px-4 py-6 text-center
                transition-colors
                ${
                  isDragging
                    ? 'border-[#F36B21] bg-[#FCE0CA]'
                    : 'border-[#D8C4AD] bg-[#F5E4CF]'
                }
                ${busy ? 'opacity-60' : ''}
              `}
            >

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FCE0CA] text-[#F36B21]">

                <UploadCloud
                  size={24}
                  strokeWidth={1.7}
                />

              </div>

              <p className="mt-3 text-xs font-semibold">
                Drop files here
              </p>

              <input
                ref={inputRef}
                type="file"
                multiple
                disabled={busy}
                accept={
                  activeTab === 'image'
                    ? '.jpg,.jpeg,.png,.webp,.bmp,.avif'
                    : '.mp4,.mov,.webm,.avi,.mkv,.m4v'
                }
                onChange={(event) =>
                  addFiles(event.target.files)
                }
                className="hidden"
              />

              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  inputRef.current?.click()
                }
                className={`${primaryButton} mt-3`}
              >
                Browse Files
              </button>

              <p className="mt-3 text-[10px] text-[#A39280]">
                {activeTab === 'image'
                  ? 'JPG, PNG, WebP, BMP, AVIF'
                  : 'MP4, MOV, WebM, AVI, MKV, M4V · 250 MB max'}
              </p>

            </div>

          </section>

          {/* NOTICE */}

          {notice && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-[#C7503E]/30 bg-[#C7503E]/5 p-3"
            >

              <AlertCircle
                size={15}
                className="mt-0.5 shrink-0 text-[#C7503E]"
              />

              <p className="flex-1 whitespace-pre-line text-[11px] leading-5 text-[#C7503E]">
                {notice}
              </p>

              <button
                type="button"
                onClick={() => setNotice('')}
                aria-label="Dismiss"
                className="text-[#C7503E]"
              >
                <X size={14} />
              </button>

            </div>
          )}

          {/* FILE LIST */}

          <section className={`${panelClass} overflow-hidden`}>

            <div className="flex items-center justify-between gap-3 border-b border-[#D8C4AD] px-4 py-3">

              <div className="flex items-center gap-2">

                <h3 className="text-xs font-bold">
                  Files
                </h3>

                <span className="rounded-md bg-[#EAD5BD] px-1.5 py-0.5 text-[10px] font-semibold text-[#857665]">
                  {visibleFiles.length}
                </span>

              </div>

              {visibleFiles.length > 0 && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={clearFiles}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-medium text-[#C7503E] hover:bg-[#C7503E]/10 disabled:opacity-40"
                >
                  <Trash2 size={12} />
                  Clear
                </button>
              )}

            </div>

            {visibleFiles.length > 0 ? (
              <div className="max-h-[480px] overflow-y-auto">

                {visibleFiles.map((item) => (
                  <FileRow
                    key={item.id}
                    item={item}
                    onRemove={removeFile}
                    onDownload={downloadFile}
                    disabled={busy}
                  />
                ))}

              </div>
            ) : (
              <div className="flex min-h-[150px] flex-col items-center justify-center gap-2 text-[#A39280]">

                <FileArchive
                  size={25}
                  strokeWidth={1.5}
                />

                <p className="text-xs">
                  No files
                </p>

              </div>
            )}

            {/* DOWNLOAD ALL */}

            {completedFiles.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#D8C4AD] bg-[#176D70]/5 px-4 py-3">

                <div
                  className={`flex items-center gap-2 ${
                    totalReduction < 0
                      ? 'text-[#C7503E]'
                      : 'text-[#176D70]'
                  }`}
                >

                  <CheckCircle2 size={16} />

                  <span className="text-xs font-semibold">
                    {getReductionLabel(totalReduction)}
                  </span>

                </div>

                <button
                  type="button"
                  disabled={busy}
                  onClick={downloadAll}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#176D70] px-3 py-2.5 text-xs font-semibold text-white hover:bg-[#10484A] disabled:opacity-40"
                >

                  {isDownloading ? (
                    <LoaderCircle
                      size={14}
                      className="animate-spin"
                    />
                  ) : (
                    <Download size={14} />
                  )}

                  {isDownloading
                    ? 'Preparing...'
                    : completedFiles.length === 1
                      ? 'Download'
                      : 'Download All'}

                </button>

              </div>
            )}

          </section>

        </div>

        {/* SETTINGS */}

        <aside className="min-w-0">

          <section className={`${panelClass} p-4`}>

            <div className="mb-5 flex items-center gap-2">

              <Settings2
                size={16}
                className="text-[#F36B21]"
              />

              <h3 className="text-xs font-bold">
                Compression Settings
              </h3>

            </div>

            {/* IMAGE SETTINGS */}

            {activeTab === 'image' && (
              <div className="space-y-5">

                <SelectField
                  label="Format"
                  value={imageFormat}
                  onChange={setImageFormat}
                  options={IMAGE_FORMATS}
                  disabled={busy}
                />

                {/* QUALITY */}

                <div>

                  <div className="mb-3 flex items-center justify-between">

                    <label
                      htmlFor="image-quality"
                      className="text-[11px] font-semibold text-[#675C50]"
                    >
                      Quality
                    </label>

                    <span className="rounded-md bg-[#FCE0CA] px-2 py-1 text-[10px] font-bold text-[#A94D19]">
                      {imageFormat === 'image/png'
                        ? 'Lossless'
                        : `${imageQuality}%`}
                    </span>

                  </div>

                  <input
                    id="image-quality"
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    disabled={
                      busy ||
                      imageFormat === 'image/png'
                    }
                    value={imageQuality}
                    onChange={(event) =>
                      setImageQuality(
                        Number(event.target.value)
                      )
                    }
                    className="h-1.5 w-full cursor-pointer accent-[#F36B21] disabled:opacity-40"
                  />

                  <div className="mt-2 flex justify-between text-[9px] text-[#A39280]">
                    <span>Smaller</span>
                    <span>Sharper</span>
                  </div>

                </div>

                <SelectField
                  label="Max Dimension"
                  value={imageResolution}
                  onChange={setImageResolution}
                  options={IMAGE_RESOLUTIONS}
                  disabled={busy}
                />

              </div>
            )}

            {/* VIDEO SETTINGS */}

            {activeTab === 'video' && (
              <div className="space-y-5">

                <div>

                  <p className={labelClass}>
                    Format
                  </p>

                  <div className={inputClass}>
                    MP4 (H.264)
                  </div>

                </div>

                <div>

                  <p className={labelClass}>
                    Quality
                  </p>

                  <div className="grid grid-cols-2 gap-2">

                    {VIDEO_PRESETS.map((preset) => {
                      const selected =
                        videoPreset === preset.name;

                      return (
                        <button
                          key={preset.name}
                          type="button"
                          disabled={busy}
                          aria-pressed={selected}
                          onClick={() =>
                            setVideoPreset(preset.name)
                          }
                          className={`
                            rounded-lg border px-2 py-2.5
                            text-[10px] font-semibold
                            transition-colors
                            disabled:opacity-40
                            ${
                              selected
                                ? 'border-[#F36B21] bg-[#FCE0CA] text-[#A94D19]'
                                : 'border-[#D8C4AD] bg-[#F5E4CF] text-[#857665] hover:border-[#F36B21]'
                            }
                          `}
                        >
                          {preset.name}
                        </button>
                      );
                    })}

                  </div>

                </div>

                <SelectField
                  label="Max Video Height"
                  value={videoResolution}
                  onChange={setVideoResolution}
                  options={VIDEO_RESOLUTIONS}
                  disabled={busy}
                />

                <Toggle
                  label="Remove Audio"
                  checked={removeAudio}
                  onChange={setRemoveAudio}
                  disabled={busy}
                />

              </div>
            )}

            {/* OPTIONS */}

            <div className="mt-5 border-t border-[#D8C4AD] pt-5">

              <Toggle
                label="Keep Smaller File"
                checked={keepSmaller}
                onChange={setKeepSmaller}
                disabled={busy}
                title="Keep the original if compression produces a larger file."
              />

            </div>

            {/* COMPRESS */}

            <button
              type="button"
              disabled={
                busy ||
                pendingFiles.length === 0
              }
              onClick={compressFiles}
              className={`${primaryButton} mt-5 w-full py-3`}
            >

              {isCompressing ? (
                <LoaderCircle
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <Minimize2 size={15} />
              )}

              {isLoadingEngine
                ? 'Loading Engine...'
                : isCompressing
                  ? 'Compressing...'
                  : 'Compress Files'}

              {!isCompressing &&
                pendingFiles.length > 0 && (
                  <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px]">
                    {pendingFiles.length}
                  </span>
                )}

            </button>

            {/* RESET */}

            {completedFiles.length > 0 && (
              <button
                type="button"
                disabled={busy}
                onClick={resetResults}
                className={`${secondaryButton} mt-2 w-full`}
              >
                <RefreshCw size={13} />
                Reset
              </button>
            )}

            {/* VIDEO NOTICE */}

            {activeTab === 'video' && (
              <div className="mt-4 flex items-start gap-1.5 text-[10px] leading-4 text-[#A39280]">

                <AlertCircle
                  size={12}
                  className="mt-0.5 shrink-0"
                />

                <span>
                  Internet required for engine loading.
                  Stay on this page during compression.
                </span>

              </div>
            )}

          </section>

        </aside>

      </div>

    </div>
  );
}

export default FileCompressor;