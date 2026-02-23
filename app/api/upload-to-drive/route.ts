import { google } from 'googleapis'
import { NextRequest, NextResponse } from 'next/server'
import { Readable } from 'stream'

// Initialize Google Drive API
const authorize = async () => {
  // Get credentials from environment variables
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const serviceAccountPrivateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n')
  const googleDriveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID

  if (!serviceAccountEmail || !serviceAccountPrivateKey || !googleDriveFolderId) {
    throw new Error(
      'Missing Google Drive configuration. Please set GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, and GOOGLE_DRIVE_FOLDER_ID environment variables.'
    )
  }

  const auth = new google.auth.JWT({
    email: serviceAccountEmail,
    key: serviceAccountPrivateKey,
    scopes: ['https://www.googleapis.com/auth/drive'],
  })

  return { auth, googleDriveFolderId }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    const { auth, googleDriveFolderId } = await authorize()

    const drive = google.drive({ version: 'v3', auth })
    const uploadedFiles = []

    for (const file of files) {
      const buffer = await file.arrayBuffer()
      const mimeType = file.type || 'application/octet-stream'

      const fileMetadata = {
        name: file.name,
        parents: [googleDriveFolderId],
      }

      try {
        const response = await drive.files.create({
          requestBody: fileMetadata,
          media: {
            mimeType: mimeType,
            body: Readable.from(Buffer.from(buffer)),
          },
          supportsAllDrives: true,
          ignoreDefaultVisibility: true,
          fields: 'id, name, webViewLink, mimeType',
        })

        uploadedFiles.push({
          fileName: file.name,
          fileId: response.data.id,
          webViewLink: response.data.webViewLink,
          mimeType: response.data.mimeType,
        })
      } catch (fileError) {
        console.error(`Error uploading file ${file.name}:`, fileError)
        uploadedFiles.push({
          fileName: file.name,
          error: 'Failed to upload file',
        })
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully uploaded ${uploadedFiles.filter(f => !f.error).length} file(s) to Google Drive`,
        files: uploadedFiles,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Upload error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
