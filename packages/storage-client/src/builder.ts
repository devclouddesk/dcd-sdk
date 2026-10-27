import type { CropMode, OutputFormat, TransformationOptions } from './types.js';

const KNOWN_IMAGE_EXTS = /\.(jpg|jpeg|png|webp|avif|gif|tiff|svg|bmp)$/i;

export class TransformationBuilder {
  private endpoint: string;
  private publicId: string;
  private options: TransformationOptions = {};
  private deliveryPrefix: string = 'image/upload';

  constructor(
    endpoint: string,
    publicId: string,
    initialOptions?: TransformationOptions,
    deliveryPrefix: string = 'image/upload'
  ) {
    this.endpoint = endpoint.replace(/\/+$/, '');
    this.publicId = publicId.replace(/^\/+/, '');
    this.deliveryPrefix = (deliveryPrefix || 'image/upload').replace(/^\/+|\/+$/g, '');
    if (initialOptions) {
      const opts: TransformationOptions = { ...initialOptions };
      if (opts.w && !opts.width) opts.width = opts.w;
      if (opts.h && !opts.height) opts.height = opts.h;
      if (opts.c && !opts.crop) opts.crop = opts.c;
      if (opts.f && !opts.format) opts.format = opts.f;
      if (opts.q && !opts.quality) opts.quality = opts.q;
      this.options = opts;
    }
  }

  /**
   * Configure delivery URL path prefix (e.g. 'v1/image', 'image/upload', 'cdn')
   */
  prefix(pathPrefix: 'v1/image' | 'image/upload' | 'cdn' | string): this {
    this.deliveryPrefix = pathPrefix.replace(/^\/+|\/+$/g, '');
    return this;
  }

  /**
   * Switch to 1:1 Cloudinary delivery path format (/image/upload/...)
   */
  cloudinaryMode(): this {
    this.deliveryPrefix = 'image/upload';
    return this;
  }

  width(w: number): this {
    this.options.width = Math.round(w);
    return this;
  }

  height(h: number): this {
    this.options.height = Math.round(h);
    return this;
  }

  resize(params: { width?: number; height?: number; crop?: CropMode }): this {
    if (params.width) this.options.width = Math.round(params.width);
    if (params.height) this.options.height = Math.round(params.height);
    if (params.crop) this.options.crop = params.crop;
    return this;
  }

  crop(mode: CropMode): this {
    this.options.crop = mode;
    return this;
  }

  format(fmt: OutputFormat): this {
    this.options.format = fmt;
    return this;
  }

  quality(q: number | 'auto'): this {
    this.options.quality = q;
    return this;
  }

  blur(sigma = 5): this {
    this.options.blur = sigma;
    return this;
  }

  grayscale(enable = true): this {
    this.options.grayscale = enable;
    return this;
  }

  sharpen(enable = true): this {
    this.options.sharpen = enable;
    return this;
  }

  rotation(rot: number | 'auto'): this {
    this.options.rotation = rot;
    return this;
  }

  /**
   * Builds the formatted transformation string (e.g. w_400,h_300,c_fill,f_auto)
   */
  toParamsString(): string {
    const parts: string[] = [];

    if (this.options.width) parts.push(`w_${this.options.width}`);
    if (this.options.height) parts.push(`h_${this.options.height}`);
    if (this.options.crop) parts.push(`c_${this.options.crop}`);
    if (this.options.format) parts.push(`f_${this.options.format}`);
    if (this.options.quality) parts.push(`q_${this.options.quality}`);
    if (this.options.blur) parts.push(`e_blur_${this.options.blur}`);
    if (this.options.grayscale) parts.push('e_gray');
    if (this.options.sharpen) parts.push('e_sharp');
    if (this.options.rotation) parts.push(`r_${this.options.rotation}`);

    return parts.length > 0 ? parts.join(',') : 'original';
  }

  /**
   * Returns the final full URL string with proper file extension
   */
  build(): string {
    const params = this.toParamsString();
    let finalPublicId = this.publicId;

    // Cloudinary standard: If a specific format was selected, ensure URL ends with that extension
    if (this.options.format && this.options.format !== 'auto') {
      const targetExt = this.options.format === 'jpeg' ? 'jpg' : this.options.format;
      if (KNOWN_IMAGE_EXTS.test(finalPublicId)) {
        finalPublicId = finalPublicId.replace(KNOWN_IMAGE_EXTS, `.${targetExt}`);
      } else {
        finalPublicId = `${finalPublicId}.${targetExt}`;
      }
    }

    if (params === 'original') {
      return `${this.endpoint}/${this.deliveryPrefix}/${finalPublicId}`;
    }
    return `${this.endpoint}/${this.deliveryPrefix}/${params}/${finalPublicId}`;
  }

  toString(): string {
    return this.build();
  }

  toURL(): URL {
    return new URL(this.build());
  }
}
