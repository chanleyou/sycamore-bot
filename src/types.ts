import { Context as BaseContext } from 'telegraf'

export interface Context extends BaseContext {
  reply: (string: string, options?: any) => void
}