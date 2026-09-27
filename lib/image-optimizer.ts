import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'png' | 'jpeg';
  fit?: 'inside' | 'cover' | 'contain' | 'fill';
}

export interface OptimizedImageResult {
  dataUri: string;
  buffer: Buffer;
  sizeBytes: number;
  format: string;
  width?: number;
  height?: number;
  relativeUrl?: string;
}

/**
 * Optimiza y comprime cualquier imagen (PNG, JPG, WEBP, GIF, SVG, etc.)
 * a formato WebP ultraliviano de alta fidelidad, asegurando persistencia permanente.
 */
export async function optimizeImage(
  input: string | Buffer,
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImageResult> {
  const {
    maxWidth = 600,
    maxHeight = 600,
    quality = 82,
    format = 'webp',
    fit = 'inside',
  } = options;

  let buffer: Buffer;

  if (Buffer.isBuffer(input)) {
    buffer = input;
  } else if (typeof input === 'string') {
    // Extraer base64 si viene con prefijo Data URI
    const base64Clean = input.includes(';base64,')
      ? input.split(';base64,')[1]
      : input;
    buffer = Buffer.from(base64Clean, 'base64');
  } else {
    throw new Error('Tipo de entrada de imagen no soportado.');
  }

  if (!buffer || buffer.length === 0) {
    throw new Error('El buffer de la imagen está vacío o corrupto.');
  }

  // Procesamiento con sharp
  let pipeline = sharp(buffer, { failOn: 'none' })
    .rotate(); // Auto-rotar según orientación EXIF (fotos de celulares)

  if (maxWidth || maxHeight) {
    pipeline = pipeline.resize({
      width: maxWidth,
      height: maxHeight,
      fit,
      withoutEnlargement: true,
    });
  }

  if (format === 'webp') {
    pipeline = pipeline.webp({
      quality,
      alphaQuality: 90,
      effort: 4,
    });
  } else if (format === 'png') {
    pipeline = pipeline.png({
      compressionLevel: 8,
      quality,
    });
  } else {
    pipeline = pipeline.jpeg({
      quality,
      mozjpeg: true,
    });
  }

  const outputBuffer = await pipeline.toBuffer();
  const metadata = await sharp(outputBuffer).metadata();

  const mimeType = format === 'webp' ? 'image/webp' : format === 'png' ? 'image/png' : 'image/jpeg';
  const dataUri = `data:${mimeType};base64,${outputBuffer.toString('base64')}`;

  return {
    dataUri,
    buffer: outputBuffer,
    sizeBytes: outputBuffer.length,
    format,
    width: metadata.width,
    height: metadata.height,
  };
}

/**
 * Guarda una copia local en disco (public/uploads/...) como respaldo,
 * capturando cualquier excepción si el sistema de archivos es efímero/de solo lectura.
 */
export async function saveLocalImageBackup(
  buffer: Buffer,
  subDir: 'logos' | 'users' | 'backgrounds',
  prefix: string,
  extension = 'webp'
): Promise<string | null> {
  try {
    const fileName = `${prefix}-${Date.now()}.${extension}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', subDir);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    await fs.promises.writeFile(filePath, buffer);

    return `/uploads/${subDir}/${fileName}`;
  } catch (err) {
    console.warn(`[IMAGE_BACKUP_WARN] No se pudo escribir respaldo en disco para ${subDir}:`, err);
    return null;
  }
}
