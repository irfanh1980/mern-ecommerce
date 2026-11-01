import { useState, useCallback, useRef, useEffect } from 'react';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

const isValidFile = (file) => {
  const typeValid = ACCEPTED_TYPES.includes(file.type);
  const sizeValid = file.size <= MAX_FILE_SIZE;
  return { typeValid, sizeValid };
};

export default function ImageUpload({
  multiple = false,
  single = false,
  accept = 'image/png, image/jpeg',
  disabled = false,
  initialUrls = [],
  onChange = () => {},
  onImagesChange = () => {},
  label = 'Product image',
}) {
  // Normalize initial values into { url, public_id } image objects.
  const normalizeImage = (v) => (typeof v === 'string' ? { url: v, public_id: '' } : v);

  const normalizedInitial = single
    ? (typeof initialUrls === 'string' && initialUrls
        ? [normalizeImage(initialUrls)]
        : Array.isArray(initialUrls)
          ? initialUrls.map(normalizeImage)
          : [])
    : (Array.isArray(initialUrls) ? initialUrls.map(normalizeImage) : []);

  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]); // local File[] pending upload
  const [uploadedUrls, setUploadedUrls] = useState(normalizedInitial); // [{ url, public_id }]
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const inputRef = useRef(null);
  const urlMapRef = useRef(new Map());

  const clearError = useCallback(() => setError(null), []);

  const getPreviewUrl = useCallback((file) => {
    if (!(file instanceof File)) return '';
    if (!urlMapRef.current.has(file)) {
      urlMapRef.current.set(file, URL.createObjectURL(file));
    }
    return urlMapRef.current.get(file);
  }, []);

  const revokeUrl = useCallback((file) => {
    const url = urlMapRef.current.get(file);
    if (url) {
      URL.revokeObjectURL(url);
      urlMapRef.current.delete(file);
    }
  }, []);

  const validateFiles = useCallback((fileList) => {
    const errors = [];
    const validFiles = [];
    for (const file of fileList) {
      const { typeValid, sizeValid } = isValidFile(file);
      if (!typeValid) errors.push(`"${file.name}" must be a PNG or JPG image.`);
      if (!sizeValid) errors.push(`"${file.name}" exceeds 5 MB.`);
      if (typeValid && sizeValid) validFiles.push(file);
    }
    return { validFiles, errors };
  }, []);

  const handleFiles = useCallback(
    (fileList) => {
      if (disabled) return;
      clearError();
      const { validFiles, errors } = validateFiles(Array.from(fileList));
      if (errors.length) {
        setError(errors.join(' '));
        return;
      }
      const next = multiple ? [...files, ...validFiles] : validFiles;
      setFiles(next);
      onChange(next);
    },
    [disabled, clearError, validateFiles, files, multiple, onChange]
  );

  const removeFile = useCallback(
    (index) => {
      const file = files[index];
      revokeUrl(file);
      const next = files.filter((_, i) => i !== index);
      setFiles(next);
      onChange(next);
      if (next.length === 0) setError(null);
    },
    [files, onChange, revokeUrl]
  );

  const removeUploaded = useCallback(
    (index) => {
      const next = uploadedUrls.filter((_, i) => i !== index);
      setUploadedUrls(next);
      onImagesChange(single ? (next[0]?.url || '') : next);
    },
    [uploadedUrls, onImagesChange, single]
  );

  const triggerPicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const onInputChange = (e) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  const uploadFiles = useCallback(async () => {
    if (files.length === 0) {
      setError('Please select at least one image.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('images', file));

      const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');

      const res = await fetch(`${API}/api/uploads`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Image upload failed');
      }

       const images = data.data.images;
       setUploadSuccess(true);
       setTimeout(() => setUploadSuccess(false), 3000);
      files.forEach((file) => revokeUrl(file));
      setFiles([]);
      if (single) {
        const next = images[0] ? [images[0]] : [];
        setUploadedUrls(next);
        onImagesChange(images[0] ? images[0].url : '');
      } else {
        const next = [...uploadedUrls, ...images];
        setUploadedUrls(next);
        onImagesChange(next);
      }
    } catch (err) {
      setError(err.message || 'Failed to upload images.');
    } finally {
      setUploading(false);
    }
  }, [files, uploadedUrls, onImagesChange, revokeUrl]);

  const onDragEnter = (e) => {
    e.preventDefault();
    if (!disabled) setDragActive(true);
  };
  const onDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setDragActive(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };
  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  useEffect(() => {
    return () => {
      urlMapRef.current.forEach((url) => URL.revokeObjectURL(url));
      urlMapRef.current.clear();
    };
  }, []);

  // Auto-upload in single (avatar) mode once a file is selected.
  useEffect(() => {
    if (single && files.length > 0) {
      uploadFiles();
    }
  }, [files, single, uploadFiles]);

  const currentUrl = single ? (uploadedUrls[0]?.url || '') : '';
  const hasPending = files.length > 0;

  return (
    <div className="space-y-3">
      {single ? (
        <>
          <div className="flex flex-col items-center gap-2">
            <div
              onDragEnter={onDragEnter}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              role="button"
              tabIndex={0}
              aria-label={disabled ? 'Profile picture upload disabled' : 'Change profile picture'}
              data-dragover={dragActive ? 'true' : 'false'}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  triggerPicker();
                }
              }}
              onClick={triggerPicker}
              className={`relative w-24 h-24 rounded-full border overflow-hidden transition-all duration-200 cursor-pointer ${disabled ? 'opacity-60' : ''} ${
                dragActive ? 'ring-2 ring-blue-500' : 'border-gray-200 hover:border-blue-400'
              } group`}
            >
              {currentUrl ? (
                <img
                  src={currentUrl}
                  alt="Profile"
                  className="w-full h-full object-cover object-center"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-8 h-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              )}

              <input
                id="profile-image-upload"
                ref={inputRef}
                type="file"
                accept={accept}
                multiple={false}
                className="sr-only"
                aria-label={label}
                onChange={onInputChange}
                disabled={disabled}
              />

              {/* Camera hover overlay */}
              {!currentUrl && !hasPending && !disabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                </div>
              )}

              {hasPending && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
                  {files.map((file) => {
                    const url = getPreviewUrl(file);
                    return (
                      <div
                        key={`${file.name}-${file.lastModified}`}
                        className="w-full h-full relative rounded-full overflow-hidden"
                      >
                        <img src={url} alt="" className="w-full h-full object-cover object-center" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(0);
                          }}
                          aria-label="Remove"
                          className="absolute top-1 right-1 z-10 p-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                  {uploading && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-xs text-blue-600">
                      <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading…
                    </div>
                  )}
                </div>
              )}
            </div>

            {!disabled && (
              <button
                type="button"
                onClick={triggerPicker}
                className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-200 shadow-sm hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                {currentUrl ? 'Change profile picture' : 'Upload profile picture'}
              </button>
            )}

            {!disabled && !currentUrl && !hasPending && (
              <p className="mt-0.5 text-xs text-gray-500">
                PNG, JPG up to 5MB &mdash; auto-cropped to fit
              </p>
            )}
          </div>

          {!currentUrl && !hasPending && disabled && (
            <p className="text-xs text-gray-500 text-center">Disabled</p>
          )}
          {!disabled && currentUrl && (
            <button
              type="button"
              onClick={() => {
                setUploadedUrls([]);
                onImagesChange('');
                setFiles([]);
              }}
              className="mt-1.5 text-xs text-red-600 hover:text-red-800 font-medium underline underline-offset-4"
            >
              Remove photo
            </button>
          )}

          {error && (
            <p
              role="alert"
              className="text-sm text-red-600 bg-red-50 rounded-md border border-red-100 px-3 py-2"
            >
              {error}
            </p>
          )}
          {uploadSuccess && (
            <p className="text-sm text-green-600 bg-green-50 rounded-md border border-green-100 px-3 py-2">
              Image uploaded successfully.
            </p>
          )}
        </>
      ) : (
        <>
          <label
            htmlFor="product-image-upload"
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>

          <div
            onDragEnter={onDragEnter}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            role="button"
            tabIndex={0}
            aria-label="Drag and drop image upload zone"
            data-dragover={dragActive ? 'true' : 'false'}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                triggerPicker();
              }
            }}
            onClick={triggerPicker}
            className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 ${
              dragActive
                ? 'bg-[#F0F7FF] border-blue-500'
                : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-blue-400'
            } ${
              disabled
                ? 'opacity-60 cursor-not-allowed pointer-events-none'
                : 'cursor-pointer'
            }`}
          >
            <div className="mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-10 h-10 ${
                  dragActive ? 'text-blue-600' : 'text-gray-400'
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </div>

            <input
              id="product-image-upload"
              ref={inputRef}
              type="file"
              accept={accept}
              multiple={multiple}
              className="sr-only"
              aria-label={label}
              onChange={onInputChange}
              disabled={disabled}
            />

            <p className="text-sm font-medium text-gray-900">
              Drag &amp; drop your product image here, or browse
            </p>
            <p className="mt-0.5 text-xs text-gray-500">PNG, JPG up to 5MB</p>

            {!disabled && (
              <button
                type="button"
                onClick={triggerPicker}
                className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-200 shadow-sm hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Browse files
              </button>
            )}
          </div>

          {error && (
            <p
              role="alert"
              className="text-sm text-red-600 bg-red-50 rounded-md border border-red-100 px-3 py-2"
            >
              {error}
            </p>
          )}
          {uploadSuccess && (
            <p className="text-sm text-green-600 bg-green-50 rounded-md border border-green-100 px-3 py-2">
              Image uploaded successfully.
            </p>
          )}

          {uploadedUrls.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                Uploaded images
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {uploadedUrls.map((item, index) => (
                  <div
                    key={item.url}
                    className="relative w-24 h-24 rounded-xl border overflow-hidden"
                  >
                    <img
                      src={item.url}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.opacity = '0.3';
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeUploaded(index);
                      }}
                      aria-label={`Remove uploaded image ${index + 1}`}
                      className="absolute top-1 right-1 z-10 p-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasPending && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                Pending upload
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {files.map((file, index) => {
                  const url = getPreviewUrl(file);
                  return (
                    <div
                      key={`${file.name}-${file.lastModified}-${index}`}
                      className="relative w-24 h-24 rounded-xl border overflow-hidden"
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        aria-label={`Remove ${file.name}`}
                        className="absolute top-1 right-1 z-10 p-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={uploadFiles}
                disabled={uploading}
                className="mt-3 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {uploading ? 'Uploading...' : 'Upload images to server'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
