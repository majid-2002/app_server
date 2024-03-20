import { client } from "../app";

export const getOrSetCache = (
  key: string,
  cb: () => Promise<any>,
): Promise<any> => {
  return new Promise(async (resolve, _) => {
    const data = await client.get(key);
    if (data) {
      resolve(JSON.parse(data));
    } else {
      const freshData = await cb();
      await client.set(key, JSON.stringify(freshData));
      resolve(freshData);
    }
  });
};

export const clearCache = async (key: string) => {
  await client.del(key);
};

export const clearAllCache = async () => {
  await client.flushAll();
};

export const clearAllCacheByPattern = async (pattern: string) => {
  const keys = await client.keys(pattern);
  keys.forEach(async (key) => {
    await client.del(key);
  });
};
