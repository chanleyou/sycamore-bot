import redis from 'redis'

const cache = redis.createClient(process.env.REDIS_URL)

cache.on('error', e => console.log(`Error: ${e}`))

export default cache
