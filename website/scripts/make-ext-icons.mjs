import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'

const siteIcon = path.resolve('../website/public/apple-touch-icon.png')
const extDir = path.resolve('../linkedin-crm-extension')
const outDir = path.join(extDir, 'icons')

async function ensureDir(dir){ await fs.mkdir(dir,{recursive:true}) }

async function run(){
  await ensureDir(outDir)
  const sizes = [16,32,48,128]
  for(const s of sizes){
    const p = path.join(outDir, `icon${s}.png`)
    await sharp(siteIcon).resize(s,s,{fit:'contain',background:{r:255,g:255,b:255,alpha:1}}).png({compressionLevel:9}).toFile(p)
  }
  // main action icon (48x48)
  await sharp(siteIcon).resize(48,48,{fit:'contain',background:{r:255,g:255,b:255,alpha:1}}).png({compressionLevel:9}).toFile(path.join(extDir,'icon.png'))
  console.log('Exported icons to', outDir)
}

run().catch(e=>{console.error(e);process.exit(1)})
