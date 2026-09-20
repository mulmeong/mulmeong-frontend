import { api, ApiError } from '@/api'

export const REVIEW_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const REVIEW_IMAGE_SIZE_MAX = 10 * 1024 * 1024

type PresignResponse = {
  items: { key: string; uploadUrl: string; fileUrl: string; contentType: string }[]
  expiresInSeconds: number
}

export async function uploadReviewImages(
  files: File[],
  onUploaded: (file: File, url: string) => void,
  signal: AbortSignal,
): Promise<void> {
  if (files.length === 0) return

  const { items } = await api.post<PresignResponse>(
    '/uploads/presign',
    { domain: 'REVIEW', files: files.map((file) => ({ contentType: file.type, size: file.size })) },
    { signal },
  )
  if (items.length !== files.length) {
    throw new ApiError(0, '사진 업로드 정보를 받지 못했어요. 다시 시도해주세요.')
  }

  for (const [index, file] of files.entries()) {
    const item = items[index]!
    let response: Response
    try {
      // S3에는 앱 인증 헤더나 쿠키 없이 파일 원본을 보낸다.
      response = await fetch(item.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': item.contentType },
        body: file,
        credentials: 'omit',
        signal,
      })
    } catch (error) {
      if (signal.aborted) throw error
      throw new ApiError(0, '사진을 업로드하지 못했어요. 연결을 확인하고 다시 시도해주세요.')
    }
    if (!response.ok) {
      throw new ApiError(response.status, '사진을 업로드하지 못했어요. 다시 시도해주세요.')
    }
    onUploaded(file, item.fileUrl)
  }
}
