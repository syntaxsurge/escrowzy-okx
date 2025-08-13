import 'server-only'

import { uploadConstants } from '@/config/business-constants'
import { processUploadedFile, getUploadUrl } from '@/lib/utils/upload'

export interface UploadOptions {
  uploadType: keyof typeof uploadConstants.UPLOAD_TYPES
  subPath?: string
  maxFileSize?: number
  allowedTypes?: string[]
  maxFiles?: number
}

export interface UploadResult {
  success: boolean
  urls?: string[]
  error?: string
  details?: any
}

export interface ProcessedUpload {
  url: string
  filename: string
  originalName: string
  mimeType: string
  size: number
}

/**
 * Centralized file upload service
 * Handles all file uploads with consistent validation and error handling
 */
export class UploadService {
  private static readonly DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  private static readonly DEFAULT_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
  private static readonly DEFAULT_DOCUMENT_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]

  /**
   * Process multiple file uploads
   */
  static async uploadFiles(
    files: File[],
    options: UploadOptions
  ): Promise<UploadResult> {
    try {
      // Validate files count
      if (!files || files.length === 0) {
        return {
          success: false,
          error: 'No files provided'
        }
      }

      const maxFiles = options.maxFiles || 10
      if (files.length > maxFiles) {
        return {
          success: false,
          error: `Too many files. Maximum ${maxFiles} files allowed`
        }
      }

      // Set defaults
      const maxFileSize = options.maxFileSize || this.DEFAULT_MAX_FILE_SIZE
      const allowedTypes = options.allowedTypes || this.DEFAULT_IMAGE_TYPES

      // Validate each file
      for (const file of files) {
        const validation = this.validateFile(file, maxFileSize, allowedTypes)
        if (!validation.valid) {
          return {
            success: false,
            error: validation.error
          }
        }
      }

      // Process uploads
      const uploadedFiles: ProcessedUpload[] = []
      const urls: string[] = []

      for (const file of files) {
        try {
          const processedFile = await processUploadedFile(file, {
            uploadType: uploadConstants.UPLOAD_TYPES[
              options.uploadType
            ] as string,
            subPath: options.subPath
          })

          const url = getUploadUrl(processedFile.relativePath)
          urls.push(url)

          uploadedFiles.push({
            url,
            filename: processedFile.filename,
            originalName: processedFile.originalName,
            mimeType: processedFile.mimeType,
            size: processedFile.size
          })
        } catch (uploadError: any) {
          // Check for specific Vercel Blob errors
          if (
            uploadError.message?.includes('BLOB_READ_WRITE_TOKEN') ||
            uploadError.message?.includes('Unauthorized')
          ) {
            return {
              success: false,
              error:
                'File storage is not configured. Please contact support if this issue persists.',
              details:
                process.env.NODE_ENV === 'development'
                  ? 'BLOB_READ_WRITE_TOKEN is not set'
                  : undefined
            }
          }

          // Network errors
          if (
            uploadError.message?.includes('fetch') ||
            uploadError.message?.includes('network')
          ) {
            return {
              success: false,
              error:
                'Network error during upload. Please check your connection and try again.'
            }
          }

          // Generic upload error
          return {
            success: false,
            error: `Failed to upload ${file.name}: ${uploadError.message || 'Unknown error'}`
          }
        }
      }

      return {
        success: true,
        urls,
        details: uploadedFiles
      }
    } catch (error: any) {
      console.error('Upload service error:', error)
      return {
        success: false,
        error: error.message || 'Failed to process uploads'
      }
    }
  }

  /**
   * Upload a single file
   */
  static async uploadFile(
    file: File,
    options: UploadOptions
  ): Promise<UploadResult> {
    return this.uploadFiles([file], { ...options, maxFiles: 1 })
  }

  /**
   * Validate a file
   */
  private static validateFile(
    file: File,
    maxFileSize: number,
    allowedTypes: string[]
  ): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > maxFileSize) {
      const sizeMB = (maxFileSize / (1024 * 1024)).toFixed(0)
      return {
        valid: false,
        error: `File "${file.name}" exceeds ${sizeMB}MB limit`
      }
    }

    // Check file type
    const fileType = file.type.toLowerCase()
    if (!allowedTypes.includes(fileType)) {
      const allowedExtensions = allowedTypes
        .map(type => type.split('/')[1])
        .join(', ')
      return {
        valid: false,
        error: `File "${file.name}" must be one of: ${allowedExtensions}`
      }
    }

    return { valid: true }
  }

  /**
   * Get upload configuration for specific upload type
   */
  static getUploadConfig(type: keyof typeof uploadConstants.UPLOAD_TYPES) {
    switch (type) {
      case 'AVATARS':
        return {
          maxFileSize: 5 * 1024 * 1024, // 5MB
          allowedTypes: this.DEFAULT_IMAGE_TYPES,
          maxFiles: 1
        }
      case 'PAYMENT_PROOFS':
      case 'DOMAIN_TRANSFER_PROOFS':
        return {
          maxFileSize: 10 * 1024 * 1024, // 10MB
          allowedTypes: this.DEFAULT_IMAGE_TYPES,
          maxFiles: 5
        }
      case 'DISPUTE_EVIDENCE':
        return {
          maxFileSize: 10 * 1024 * 1024, // 10MB
          allowedTypes: this.DEFAULT_DOCUMENT_TYPES,
          maxFiles: 10
        }
      case 'ATTACHMENTS':
        return {
          maxFileSize: 25 * 1024 * 1024, // 25MB
          allowedTypes: [
            ...this.DEFAULT_DOCUMENT_TYPES,
            'application/zip',
            'text/plain',
            'application/json'
          ],
          maxFiles: 5
        }
      default:
        return {
          maxFileSize: this.DEFAULT_MAX_FILE_SIZE,
          allowedTypes: this.DEFAULT_IMAGE_TYPES,
          maxFiles: 5
        }
    }
  }
}

export const uploadService = UploadService
