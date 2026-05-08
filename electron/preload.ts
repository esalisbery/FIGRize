import { contextBridge, ipcRenderer } from 'electron'
import type { IpcRendererEvent } from 'electron'

export type FacebookConnectedPayload =
  | { success: true; pages: { id: string; name: string; access_token: string; category: string }[] }
  | { success: false; error: string }

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  /** Opens an OAuth popup BrowserWindow pointing at the local Express server */
  connectFacebook: () => ipcRenderer.send('facebook-connect'),

  /**
   * Listen for the result of the Facebook OAuth flow.
   * Returns an unsubscribe function.
   */
  onFacebookConnected: (cb: (payload: FacebookConnectedPayload) => void) => {
    const listener = (_event: IpcRendererEvent, payload: FacebookConnectedPayload) => cb(payload)
    ipcRenderer.on('facebook-connected', listener)
    return () => ipcRenderer.off('facebook-connected', listener)
  },

  /** Publish (or schedule) a text post to a connected Facebook Page */
  postToFacebook: (data: { pageId: string; message: string; scheduledTime?: string }) =>
    ipcRenderer.invoke('facebook-post', data) as Promise<{ id?: string; error?: string }>,

  /** Upload a colored-background post rendered as a JPEG image */
  postImageToFacebook: (data: { pageId: string; imageBase64: string; caption?: string }) =>
    ipcRenderer.invoke('facebook-post-image', data) as Promise<{ id?: string; error?: string }>,
})
