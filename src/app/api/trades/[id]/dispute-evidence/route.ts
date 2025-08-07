import { NextResponse } from 'next/server'

import { uploadConstants } from '@/config/business-constants'
import { getSession } from '@/lib/auth/session'
import { processUploadedFile, getUploadUrl } from '@/lib/utils/upload'
import { getTradeWithUsers } from '@/services/trade'

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const tradeId = parseInt(params.id)
    if (isNaN(tradeId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid trade ID' },
        { status: 400 }
      )
    }

    // Verify the trade exists and user is part of it
    const trade = await getTradeWithUsers(tradeId)
    if (!trade) {
      return NextResponse.json(
        { success: false, error: 'Trade not found' },
        { status: 404 }
      )
    }

    if (
      trade.buyerId !== session.user.id &&
      trade.sellerId !== session.user.id
    ) {
      return NextResponse.json(
        { success: false, error: 'You are not part of this trade' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      )
    }

    // Process uploaded images using centralized utility
    const uploadedImages: string[] = []
    const maxFileSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

    for (const file of files) {
      if (file.size > maxFileSize) {
        return NextResponse.json(
          { success: false, error: `File ${file.name} exceeds 10MB limit` },
          { status: 400 }
        )
      }

      // Validate file type
      const fileType = file.type.toLowerCase()
      if (!allowedTypes.includes(fileType)) {
        return NextResponse.json(
          {
            success: false,
            error: `File ${file.name} must be an image (JPEG, PNG, GIF, or WebP)`
          },
          { status: 400 }
        )
      }

      const processedFile = await processUploadedFile(file, {
        uploadType: uploadConstants.UPLOAD_TYPES.DISPUTE_EVIDENCE,
        subPath: `trade-${tradeId}`
      })

      uploadedImages.push(getUploadUrl(processedFile.relativePath))
    }

    return NextResponse.json({
      success: true,
      images: uploadedImages
    })
  } catch (error) {
    console.error('Error uploading dispute evidence:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload dispute evidence' },
      { status: 500 }
    )
  }
}
