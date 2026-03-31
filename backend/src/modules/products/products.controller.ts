import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Post,
  Put,
  Req,
  Param,
  UploadedFiles,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import * as fs from "fs";
import * as path from "path";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ProductsService } from "./products.service";

type AuthedRequest = { user?: { storeId: string; domain?: string } };

function getDomainFolder(req: AuthedRequest) {
  const rawDomain = req.user?.domain || "unknown";
  const withPrefix = rawDomain.startsWith("@") ? rawDomain : `@${rawDomain}`;
  const safeWithPrefix = withPrefix.replace(/[^a-zA-Z0-9.@-]/g, "_");
  const safeWithoutPrefix = rawDomain.replace(/[^a-zA-Z0-9.-]/g, "_");
  const baseDir = path.resolve(process.cwd(), "assets", "uploads");
  const withPrefixDir = path.join(baseDir, safeWithPrefix);
  const withoutPrefixDir = path.join(baseDir, safeWithoutPrefix);
  if (fs.existsSync(withPrefixDir)) {
    return safeWithPrefix;
  }
  if (fs.existsSync(withoutPrefixDir)) {
    return safeWithoutPrefix;
  }
  return safeWithPrefix;
}

function buildMediaUrls(domainFolder: string, files: string[] | null) {
  if (!files || files.length === 0) return [];
  const base = process.env.PUBLIC_BASE_URL || "";
  return files.map((file) => `${base}/uploads/${domainFolder}/${file}`);
}

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function moveMediaFiles(
  domainFolder: string,
  productId: string,
  files: Array<{ filename: string }>
) {
  const baseDir = path.resolve(process.cwd(), "assets", "uploads");
  const tempDir = path.join(baseDir, domainFolder, "_temp");
  const productDir = path.join(baseDir, domainFolder, productId);
  ensureDir(productDir);
  files.forEach((file) => {
    const from = path.join(tempDir, file.filename);
    const to = path.join(productDir, file.filename);
    if (fs.existsSync(from)) {
      fs.renameSync(from, to);
    }
  });
  return files.map((file) => `${productId}/${file.filename}`);
}

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Req() req: AuthedRequest) {
    const storeId = req.user?.storeId;
    const domainFolder = getDomainFolder(req);
    const products = storeId
      ? await this.productsService.findByStore(storeId)
      : [];

    return {
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        estimatedPrice: product.estimatedPrice,
        status: product.status,
        mediaCount: product.mediaCount,
        mediaType: product.mediaType,
        mediaUrls: buildMediaUrls(domainFolder, product.mediaFiles)
      }))
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FilesInterceptor("files", 4, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const domainFolder = getDomainFolder(req as AuthedRequest);
          const uploadDir = path.resolve(
            process.cwd(),
            "assets",
            "uploads",
            domainFolder,
            "_temp"
          );
          ensureDir(uploadDir);
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname);
          const base = path.basename(file.originalname, ext);
          const safeBase = base.replace(/[^a-zA-Z0-9_-]/g, "_");
          cb(null, `${Date.now()}_${safeBase}${ext}`);
        }
      }),
      fileFilter: (req, file, cb) => {
        if (
          file.mimetype.startsWith("image/") ||
          file.mimetype.startsWith("video/")
        ) {
          cb(null, true);
        } else {
          cb(new BadRequestException("Arquivo invalido"), false);
        }
      }
    })
  )
  async create(
    @Req() req: AuthedRequest,
    @UploadedFiles()
    files: Array<{ filename: string; mimetype: string }>
  ) {
    const storeId = req.user?.storeId;
    if (!storeId) {
      throw new BadRequestException("Loja invalida");
    }

    const { name, description, estimatedPrice } = (req as any).body || {};
    if (!name || typeof name !== "string") {
      throw new BadRequestException("Nome do produto obrigatorio");
    }

    const mediaFiles = files?.map((file) => file.filename) ?? [];
    const hasVideo = files?.some((file) => file.mimetype.startsWith("video/"));
    const hasImage = files?.some((file) => file.mimetype.startsWith("image/"));

    if (hasVideo && hasImage) {
      throw new BadRequestException(
        "Envie apenas 1 video ou ate 4 fotos"
      );
    }
    
    if (hasVideo && mediaFiles.length !== 1) {
      throw new BadRequestException("Envie apenas 1 video");
    }
    if (hasImage && mediaFiles.length > 4) {
      throw new BadRequestException("Envie no maximo 4 fotos");
    }

    const product = await this.productsService.create({
      storeId,
      name,
      description: description ? String(description) : null,
      estimatedPrice: estimatedPrice ? String(estimatedPrice) : null,
      mediaCount: 0,
      mediaType: hasVideo ? "video" : "photo",
      mediaFiles: null
    });

    const domainFolder = getDomainFolder(req);
    let storedFiles: string[] | null = null;
    if (mediaFiles.length > 0) {
      storedFiles = moveMediaFiles(domainFolder, product.id, files);
      await this.productsService.updateById(product.id, storeId, {
        mediaCount: storedFiles.length,
        mediaType: hasVideo ? "video" : "photo",
        mediaFiles: storedFiles
      });
    }
    return {
      product: {
        id: product.id,
        name: product.name,
        status: product.status,
        mediaCount: storedFiles ? storedFiles.length : 0,
        mediaType: hasVideo ? "video" : "photo",
        mediaUrls: buildMediaUrls(domainFolder, storedFiles)
      }
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put(":id")
  @UseInterceptors(
    FilesInterceptor("files", 4, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const domainFolder = getDomainFolder(req as AuthedRequest);
          const uploadDir = path.resolve(
            process.cwd(),
            "assets",
            "uploads",
            domainFolder,
            "_temp"
          );
          ensureDir(uploadDir);
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname);
          const base = path.basename(file.originalname, ext);
          const safeBase = base.replace(/[^a-zA-Z0-9_-]/g, "_");
          cb(null, `${Date.now()}_${safeBase}${ext}`);
        }
      }),
      fileFilter: (req, file, cb) => {
        if (
          file.mimetype.startsWith("image/") ||
          file.mimetype.startsWith("video/")
        ) {
          cb(null, true);
        } else {
          cb(new BadRequestException("Arquivo invalido"), false);
        }
      }
    })
  )
  async update(
    @Req() req: AuthedRequest,
    @Param("id") id: string,
    @UploadedFiles()
    files: Array<{ filename: string; mimetype: string }>
  ) {
    const storeId = req.user?.storeId;
    if (!storeId) {
      throw new BadRequestException("Loja invalida");
    }

    const { name, description, estimatedPrice, status } =
      (req as any).body || {};
    if (!name || typeof name !== "string") {
      throw new BadRequestException("Nome do produto obrigatorio");
    }

    const mediaFiles = files?.map((file) => file.filename) ?? [];
    const hasVideo = files?.some((file) => file.mimetype.startsWith("video/"));
    const hasImage = files?.some((file) => file.mimetype.startsWith("image/"));

    if (hasVideo && hasImage) {
      throw new BadRequestException(
        "Envie apenas 1 video ou ate 4 fotos"
      );
    }
    if (hasVideo && mediaFiles.length !== 1) {
      throw new BadRequestException("Envie apenas 1 video");
    }
    if (hasImage && mediaFiles.length > 4) {
      throw new BadRequestException("Envie no maximo 4 fotos");
    }

    const payload: {
      name: string;
      description: string | null;
      estimatedPrice: string | null;
      status?: string;
      mediaCount?: number;
      mediaType?: string;
      mediaFiles?: string[] | null;
    } = {
      name,
      description: description ? String(description) : null,
      estimatedPrice: estimatedPrice ? String(estimatedPrice) : null
    };

    if (typeof status === "string" && status.trim()) {
      payload.status = status.trim();
    }

    const existing = await this.productsService.findByIdForStore(id, storeId);
    if (!existing) {
      throw new NotFoundException("Produto nao encontrado");
    }

    const domainFolder = getDomainFolder(req);
    let storedFiles = existing.mediaFiles;
    if (mediaFiles.length > 0) {
      const uploadDir = path.resolve(
        process.cwd(),
        "assets",
        "uploads",
        domainFolder
      );
      if (existing.mediaFiles && existing.mediaFiles.length > 0) {
        existing.mediaFiles.forEach((file) => {
          const filePath = path.join(uploadDir, file);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }
      storedFiles = moveMediaFiles(domainFolder, id, files);
      payload.mediaCount = storedFiles.length;
      payload.mediaType = hasVideo ? "video" : "photo";
      payload.mediaFiles = storedFiles;
    }

    const product = await this.productsService.updateById(
      id,
      storeId,
      payload
    );
    if (!product) {
      throw new NotFoundException("Produto nao encontrado");
    }
    return {
      product: {
        id: product.id,
        name: product.name,
        status: product.status,
        mediaCount: product.mediaCount,
        mediaType: product.mediaType,
        mediaUrls: buildMediaUrls(domainFolder, storedFiles || product.mediaFiles)
      }
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  async remove(@Req() req: AuthedRequest, @Param("id") id: string) {
    const storeId = req.user?.storeId;
    if (!storeId) {
      throw new BadRequestException("Loja invalida");
    }
    const product = await this.productsService.findByIdForStore(id, storeId);
    if (!product) {
      throw new NotFoundException("Produto nao encontrado");
    }

    const domainFolder = getDomainFolder(req);
    const uploadDir = path.resolve(
      process.cwd(),
      "assets",
      "uploads",
      domainFolder
    );
    if (product.mediaFiles && product.mediaFiles.length > 0) {
      product.mediaFiles.forEach((file) => {
        const filePath = path.join(uploadDir, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    await this.productsService.deleteById(id, storeId);
    return { ok: true };
  }
}
