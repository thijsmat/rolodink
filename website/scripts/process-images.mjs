import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'
import pngToIco from 'png-to-ico'

const root = path.resolve('..')
const srcDir = path.join(root, 'afbeeldingen')
const outDir = path.resolve('public')

const files = {
  logo: 'rolodinklogo.png',
  favicon: 'rolodink.png',
  logoSmall: 'rolodinklogo_klein.png'
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function trimPng(inputPath) {
  const img = sharp(inputPath)
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true })

  let minX = info.width, minY = info.height, maxX = 0, maxY = 0
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * 4
      const a = data[idx + 3]
      if (a > 0) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }

  if (maxX <= minX || maxY <= minY) {
    return sharp(inputPath) // fallback
  }

  const left = Math.max(minX - 2, 0)
  const top = Math.max(minY - 2, 0)
  const width = Math.min(maxX - left + 4, info.width - left)
  const height = Math.min(maxY - top + 4, info.height - top)

  return sharp(inputPath).extract({ left, top, width, height })
}

async function run() {
  await ensureDir(outDir)

  // 1) Site logo (trimmed, exported as PNG and SVG-like PNG)
  const logoIn = path.join(srcDir, files.logo)
  const logoOut = path.join(outDir, 'logo.png')
  const logo = await trimPng(logoIn)
  await logo.png({ compressionLevel: 9 }).toFile(logoOut)

  // 2) Apple touch icon 180x180
  const appleIn = path.join(srcDir, files.favicon)
  const applePng = await trimPng(appleIn)
  const appleOut = path.join(outDir, 'apple-touch-icon.png')
  await applePng.resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } }).png({ compressionLevel: 9 }).toFile(appleOut)

  // 3) Favicon ICO from multiple sizes
  const sizes = [16, 32, 48]
  const tmpPngs = await Promise.all(
    sizes.map(async (s) => {
      const buf = await applePng
        .resize(s, s, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png({ compressionLevel: 9 })
        .toBuffer()
      const p = path.join(outDir, `favicon-${s}.png`)
      await fs.writeFile(p, buf)
      return p
    })
  )
  const icoBuf = await pngToIco(tmpPngs)
  await fs.writeFile(path.join(outDir, 'favicon.ico'), icoBuf)

  // 4) Small logo for compact placements
  const logoSmallIn = path.join(srcDir, files.logoSmall)
  const logoSmallOut = path.join(outDir, 'logo-small.png')
  const logoSmall = await trimPng(logoSmallIn)
  await logoSmall.png({ compressionLevel: 9 }).toFile(logoSmallOut)

  // cleanup tmp pngs
  await Promise.all(tmpPngs.map((p) => fs.rm(p, { force: true })))

  console.log('Images processed into public/: logo.png, logo-small.png, apple-touch-icon.png, favicon.ico')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
