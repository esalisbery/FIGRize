export {}

interface FacebookConnectedPayload {
  success: true
  pages: { id: string; name: string; access_token: string; category: string }[]
}

interface FacebookConnectedFailure {
  success: false
  error: string
}

declare global {
  interface Window {
    electronAPI: {
      platform: string
      connectFacebook: () => void
      onFacebookConnected: (
        cb: (payload: FacebookConnectedPayload | FacebookConnectedFailure) => void
      ) => () => void
      postToFacebook: (data: {
        pageId: string
        message: string
        scheduledTime?: string
      }) => Promise<{ id?: string; error?: string }>
      postImageToFacebook: (data: {
        pageId: string
        imageBase64: string
        caption?: string
      }) => Promise<{ id?: string; error?: string }>
    }
  }
}
