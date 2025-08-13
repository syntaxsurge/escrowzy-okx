import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUserAction } from '@/lib/actions/user'
import { db } from '@/lib/db/drizzle'
import { attachments } from '@/lib/db/schema'
import { uploadService } from '@/services/upload'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserAction()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const messageId = formData.get('messageId') as string

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID required' },
        { status: 400 }
      )
    }

    // Upload files using centralized service
    const uploadResult = await uploadService.uploadFiles(files, {
      uploadType: 'ATTACHMENTS',
      subPath: `message-${messageId}`
    })

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error || 'Failed to upload files' },
        { status: 400 }
      )
    }

    const uploadedFiles: Array<{
      id: number
      filename: string
      mimeType: string
      size: number
      url: string
    }> = []

    // Save attachment records to database
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const url = uploadResult.urls![i]
      const details = uploadResult.details![i]

      const [attachment] = await db
        .insert(attachments)
        .values({
          messageId: parseInt(messageId),
          userId: user.id,
          filename: file.name,
          mimeType: details.mimeType,
          path: url,
          size: file.size
        })
        .returning()

      uploadedFiles.push({
        id: attachment.id,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        size: attachment.size,
        url
      })
    }

    return NextResponse.json({ files: uploadedFiles })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    )
  }
}
