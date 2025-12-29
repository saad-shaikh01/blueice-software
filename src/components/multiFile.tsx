import { AlertCircle, File, Upload, X } from 'lucide-react';
import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Form, FormField } from '@/components/ui/form';
import { cn, formatFileSize } from '@/lib/utils';

import { getFileIcon } from './get-file-category';

interface FileWithPreview extends File {
  id: string;
  preview?: string;
}

interface MultiFileUploadProps {
  taskFileForm: any;
  onSubmit: (data: any) => void;
  isPending: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  acceptedFileTypes?: string[];
}

export interface MultiFileUploadRef {
  clearFiles: () => void;
}

const MultiFileUpload = forwardRef<MultiFileUploadRef, MultiFileUploadProps>(
  (
    {
      taskFileForm,
      onSubmit,
      isPending,
      maxFiles = 10,
      maxFileSize = 10,
      acceptedFileTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.txt'],
    },
    ref,
  ) => {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        return `File ${file.name} is too large. Maximum size is ${maxFileSize}MB.`;
      }

      // Check file type if specified
      if (acceptedFileTypes.length > 0) {
        const isValidType = acceptedFileTypes.some((type) => {
          if (type.startsWith('.')) {
            return file.name.toLowerCase().endsWith(type.toLowerCase());
          }
          if (type.includes('*')) {
            const [mainType] = type.split('/');
            return file.type.startsWith(mainType);
          }
          return file.type === type;
        });

        if (!isValidType) {
          return `File ${file.name} is not a supported file type.`;
        }
      }

      return null;
    };

    const processFiles = useCallback(
      (fileList: FileList | File[]) => {
        const newErrors: string[] = [];
        const validFiles: FileWithPreview[] = [];

        Array.from(fileList).forEach((file) => {
          // Check if we've reached max files
          if (files.length + validFiles.length >= maxFiles) {
            newErrors.push(`Maximum ${maxFiles} files allowed.`);
            return;
          }

          // Check if file already exists
          if (files.some((f) => f.name === file.name && f.size === file.size)) {
            newErrors.push(`File ${file.name} is already selected.`);
            return;
          }

          // Validate file
          const error = validateFile(file);
          if (error) {
            newErrors.push(error);
            return;
          }

          // Create file with unique ID
          const fileWithPreview: FileWithPreview = Object.assign(file, {
            id: Math.random().toString(36).substring(7),
          });

          // Create preview for images
          if (file.type.startsWith('image/')) {
            fileWithPreview.preview = URL.createObjectURL(file);
          }

          validFiles.push(fileWithPreview);
        });

        if (validFiles.length > 0) {
          const updatedFiles = [...files, ...validFiles];
          setFiles(updatedFiles);
          taskFileForm.setValue('files', updatedFiles);
        }

        setErrors(newErrors);
      },
      [files, maxFiles, taskFileForm],
    );

    const handleDrop = useCallback(
      (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          processFiles(e.dataTransfer.files);
        }
      },
      [processFiles],
    );

    const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === 'dragenter' || e.type === 'dragover') {
        setDragActive(true);
      } else if (e.type === 'dragleave') {
        setDragActive(false);
      }
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        processFiles(e.target.files);
        e.target.value = '';
      }
    };

    const removeFile = (fileId: string) => {
      const updatedFiles = files.filter((file) => {
        if (file.id === fileId) {
          // Revoke object URL to prevent memory leaks
          if (file.preview) {
            URL.revokeObjectURL(file.preview);
          }
          return false;
        }
        return true;
      });
      setFiles(updatedFiles);
      taskFileForm.setValue('files', updatedFiles);
    };

    const clearAllFiles = useCallback(() => {
      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
      setFiles([]);
      taskFileForm.setValue('files', []);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }, [files, taskFileForm]);

    // Expose clearFiles method to parent component
    useImperativeHandle(
      ref,
      () => ({
        clearFiles: clearAllFiles,
      }),
      [clearAllFiles],
    );

    return (
      <Form {...taskFileForm}>
        <form onSubmit={taskFileForm.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            disabled={isPending}
            control={taskFileForm.control}
            name="files"
            render={({ field }) => (
              <div className="flex flex-col gap-y-4">
                <div className="flex items-center justify-between">
                  {/* <p className="text-sm font-medium">Upload Task Files</p> */}
                  {files.length > 0 && (
                    <Button type="button" variant="outline" size="sm" onClick={clearAllFiles} disabled={isPending}>
                      Clear All
                    </Button>
                  )}
                </div>

                {/* Drop Zone */}
                <div
                  className={cn(
                    'relative rounded-lg border-2 border-dashed p-8 text-center transition-colors',
                    dragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground/50',
                    isPending && 'cursor-not-allowed opacity-50',
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileInput}
                    disabled={isPending}
                    accept={acceptedFileTypes.join(',')}
                  />

                  <div className="flex flex-col items-center space-y-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>

                    <div className="space-y-2">
                      <p className="text-lg font-medium">{dragActive ? 'Drop files here' : 'Drag & drop files here'}</p>
                      <p className="text-sm text-muted-foreground">
                        or{' '}
                        <button
                          type="button"
                          className="font-medium text-primary hover:text-primary/90"
                          onClick={() => inputRef.current?.click()}
                          disabled={isPending}
                        >
                          browse files
                        </button>
                      </p>
                    </div>

                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>
                        Maximum {maxFiles} files, up to {maxFileSize}MB each
                      </p>
                    </div>
                  </div>
                </div>

                {/* Error Messages */}
                {errors.length > 0 && (
                  <div className="space-y-2">
                    {errors.map((error, index) => (
                      <div key={index} className="flex items-center gap-2 rounded bg-destructive/10 p-2 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                      </div>
                    ))}
                  </div>
                )}

                {/* File List */}
                {files.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">
                      Selected Files ({files.length}/{maxFiles})
                    </p>
                    <div className="max-h-60 space-y-2 overflow-y-auto">
                      {files.map((file) => (
                        <div key={file.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                          <div className="flex min-w-0 flex-1 items-center space-x-3">
                            {file.preview ? (
                              <img src={file.preview} alt={file.name} className="h-10 w-10 rounded object-cover" />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">{getFileIcon(file.type)}</div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{file.name}</p>
                              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(file.id)}
                            disabled={isPending}
                            className="ml-2 flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending || files.length === 0} className="min-w-[100px]">
              {isPending ? 'Uploading...' : `Upload ${files.length} file${files.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </form>
      </Form>
    );
  },
);

export default MultiFileUpload;
