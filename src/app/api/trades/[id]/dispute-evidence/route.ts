import { NextResponse } from 'next/server'

import { getSession } from '@/lib/auth/session'
import { getTradeWithUsers } from '@/services/trade'
import { uploadService } from '@/services/upload'

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

    // Process uploaded images using centralized service
    const uploadResult = await uploadService.uploadFiles(files, {
      uploadType: 'DISPUTE_EVIDENCE',
      subPath: `trade-${tradeId}`
    })

    if (!uploadResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: uploadResult.error || 'Failed to upload files'
        },
        { status: 400 }
      )
    }

    const uploadedImages = uploadResult.urls || []

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
