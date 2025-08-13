import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import { getCurrentUserAction } from '@/lib/actions/user'
import { db } from '@/lib/db/drizzle'
import { users } from '@/lib/db/schema'
import { uploadService } from '@/services/upload'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserAction()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('avatar') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Process and save the file using centralized service
    const uploadResult = await uploadService.uploadFile(file, {
      uploadType: 'AVATARS',
      subPath: `user-${user.id}`
    })

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error || 'Failed to upload avatar' },
        { status: 400 }
      )
    }

    const avatarUrl = uploadResult.urls?.[0]
    const fileDetails = uploadResult.details?.[0]

    if (!avatarUrl || !fileDetails) {
      return NextResponse.json(
        { error: 'Failed to process avatar upload' },
        { status: 500 }
      )
    }

    // Update user's avatar path in database
    await db
      .update(users)
      .set({
        avatarPath: avatarUrl,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id))

    return NextResponse.json({
      success: true,
      avatarUrl
    })
  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    const user = await getCurrentUserAction()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Remove avatar path from database
    await db
      .update(users)
      .set({
        avatarPath: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Avatar delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete avatar' },
      { status: 500 }
    )
  }
}
