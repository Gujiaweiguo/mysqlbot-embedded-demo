import { request } from '@/utils/request'

export const EmbeddedTokenApi = {
  generage: (appId?: string) => request.get('/token/', appId ? { params: { appId } } : undefined)
}
