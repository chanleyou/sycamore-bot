import redis from 'redis'
import dotenv from 'dotenv'
import moment from 'moment'

if (process.env.NODE_ENV === 'development') dotenv.config()

export const cache = redis.createClient(process.env.REDIS_URL)

cache.on('error', e => console.log(`Error: ${e}`))

export const rpush = (message_id: string | number, chat_id: string | number) => {
  const timestamp = moment().toISOString()
  cache.rpush('store', [message_id, chat_id, timestamp].join(','))
}

export const llen = (): Promise<number> => {
  return new Promise((resolve, reject) => {
    cache.llen('store', (e, len) => {
      if (e) return reject(e)
      return resolve(len)
    })
  })
}

export const lindex = (i: number): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    cache.lindex('store', i, (e, message) => {
      if (e) return reject(e)
      return resolve(message)
    })
  })
}

export const lpop = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    cache.lpop('store', (e, message) => {
      if (e) return reject(e)
      if (message == null) return resolve(null)
      return resolve(message)
    })
  })
}

export const lrange = (start = 0, end = -1): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    cache.lrange('store', start, end, (e, messages) => {
      if (e) return reject(e)
      return resolve(messages)
    })
  })
}

export const lrem = (message: string) => cache.lrem('store', 1, message)

export const lpush = (message: string) => cache.lpush('store', message)
