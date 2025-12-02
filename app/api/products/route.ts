import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { JWTPayload } from "@/lib/types";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const sellerId = searchParams.get("sellerId");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");
  const sort = searchParams.get("sort") || "newest";

  const where: Prisma.ProductWhereInput = {};
  if (categoryId) where.categoryId = parseInt(categoryId);
  if (sellerId) where.sellerId = parseInt(sellerId);
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  if (sort === "price_asc") orderBy = { price: "asc" };
  if (sort === "price_desc") orderBy = { price: "desc" };

  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true, seller: { select: { name: true, email: true } } },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      metadata: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    return NextResponse.json({ error: "Error fetching products" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("unimarket_token")?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    const userId = Number(decoded.sub); 

    if (!userId) {
      return NextResponse.json({ error: "Invalid token: missing user ID" }, { status: 401 });
    }

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const categoryId = parseInt(formData.get("categoryId") as string);
    const image = formData.get("image") as File;

    if (!image) return NextResponse.json({ error: "Image required" }, { status: 400 });
    if (isNaN(categoryId)) return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });

    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResponse = await new Promise<{secure_url: string}>((resolve, reject) => {
      cloudinary.uploader.upload_stream({}, (error, result) => {
        if (error) reject(error);
        else resolve(result!);
      }).end(buffer);
    });

    const product = await prisma.product.create({
      data: {
        title,
        description,
        price,
        imageUrl: uploadResponse.secure_url,
        category: {
          connect: { id: categoryId }
        },
        seller: {
          connect: { id: userId }
        }
      },
    });

    return NextResponse.json(product);
  } catch (err) {
    console.error("CREATE PRODUCT ERROR:", err);
    const errorMessage = err instanceof Error ? err.message : "Error creating product";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
