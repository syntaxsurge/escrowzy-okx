import 'server-only'

import crypto from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

import { put } from '@vercel/blob'
import { fileTypeFromBuffer } from 'file-type'

import type { UploadConfig, ProcessedFile } from './upload-common'

export { validateImageFile, getUploadUrl } from './upload-common'
export type { UploadConfig, ProcessedFile } from './upload-common'

// Check if we're running on Vercel
const isVercel = process.env.VERCEL === '1'

export async function processUploadedFile(
  file: File,
  config: UploadConfig
): Promise<ProcessedFile> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Detect the actual file type from the buffer
  const fileTypeResult = await fileTypeFromBuffer(buffer)
  const detectedMimeType =
    fileTypeResult?.mime || file.type || 'application/octet-stream'
  const fileExt = fileTypeResult?.ext || file.name.split('.').pop() || 'bin'

  const uniqueId = crypto.randomBytes(8).toString('hex')
  const safeFilename = `${uniqueId}.${fileExt}`

  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  const pathSegments = [config.uploadType, String(year), month, day]
  if (config.subPath) {
    pathSegments.push(config.subPath)
  }

  const relativePath = path.join(...pathSegments, safeFilename)

  if (isVercel && process.env.BLOB_READ_WRITE_TOKEN) {
    // Use Vercel Blob storage in production
    const blob = await put(relativePath, buffer, {
      access: 'public',
      contentType: detectedMimeType,
      addRandomSuffix: false
    })

    return {
      buffer,
      filename: safeFilename,
      originalName: file.name,
      mimeType: detectedMimeType,
      size: file.size,
      extension: fileExt,
      relativePath: blob.url, // Store the blob URL as relativePath for consistency
      absolutePath: blob.url // Also store as absolutePath for backward compatibility
    }
  } else {
    // Use filesystem storage in development
    const uploadsRoot = path.join(process.cwd(), 'uploads', ...pathSegments)
    const absolutePath = path.join(uploadsRoot, safeFilename)

    await mkdir(uploadsRoot, { recursive: true })
    await writeFile(absolutePath, buffer)

    return {
      buffer,
      filename: safeFilename,
      originalName: file.name,
      mimeType: detectedMimeType,
      size: file.size,
      extension: fileExt,
      relativePath,
      absolutePath
    }
  }
}
