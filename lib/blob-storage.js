'use strict'

const { put, head } = require('@vercel/blob')

const BLOB_PREFIX = 'licenses/'

const BLOB_PATHS = {
  private: `${BLOB_PREFIX}legitimate-licenses.json`,
  public: `${BLOB_PREFIX}legitimate-licenses.public.json`,
}

async function loadBlob(blobPath) {
  try {
    const metadata = await head(blobPath)
    const response = await fetch(metadata.url)
    if (!response.ok) {
      console.error(`Failed to fetch blob ${blobPath}: ${response.status}`)
      return null
    }
    return await response.json()
  } catch (error) {
    if (error.code === 'blob_not_found' || error.name === 'BlobNotFoundError') {
      return null
    }
    console.error(`Error loading blob ${blobPath}:`, error.message)
    return null
  }
}

async function saveBlob(blobPath, data) {
  try {
    const content = JSON.stringify(data, null, 2)
    const result = await put(blobPath, content, {
      access: /** @type {const} */ ('public'),
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    })
    return result
  } catch (error) {
    console.error(`Error saving blob ${blobPath}:`, error.message)
    return null
  }
}

module.exports = { loadBlob, saveBlob, BLOB_PATHS }
