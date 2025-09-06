import { ProductRepository } from '../repositories/product.repository.js';
import { Prisma } from '@prisma/client';

type Product = Prisma.ProductGetPayload<{}>;
import {
    CreateProductRequest,
    UpdateProductRequest,
    ProductResponse,
    ProductListResponse,
    ProductSingleResponse,
    ProductCreateResponse,
    ProductUpdateResponse,
    ProductDeleteResponse
} from '../models/Product.js';

export class ProductService {
    private productRepository: ProductRepository;

    constructor() {
        this.productRepository = new ProductRepository();
    }

    async createProduct(productData: CreateProductRequest): Promise<ProductCreateResponse> {
        try {
            this.validateCreateProductRequest(productData);

            const product = await this.productRepository.create(productData);

            return {
                success: true,
                message: 'Product created successfully',
                data: {
                    id: product.id,
                    name: product.name,
                    type: product.type,
                },
            };
        } catch (error: any) {
            return {
                success: false,
                message: this.getErrorMessage(error),
            };
        }
    }

    async getProductById(id: number): Promise<ProductSingleResponse> {
        try {
            const product = await this.productRepository.findById(id);

            if (!product) {
                return {
                    success: false,
                    message: 'Product not found',
                };
            }

            return {
                success: true,
                message: 'Product retrieved successfully',
                data: this.mapProductToResponse(product),
            };
        } catch (error: any) {
            return {
                success: false,
                message: this.getErrorMessage(error),
            };
        }
    }

    async getAllProducts(): Promise<ProductListResponse> {
        try {
            const products = await this.productRepository.findAll();
            const total = await this.productRepository.count();

            return {
                success: true,
                message: 'Products retrieved successfully',
                data: products.map(product => this.mapProductToResponse(product)),
                total,
            };
        } catch (error: any) {
            return {
                success: false,
                message: this.getErrorMessage(error),
            };
        }
    }

    async updateProduct(id: number, productData: UpdateProductRequest): Promise<ProductUpdateResponse> {
        try {
            // Check if product exists
            const existingProduct = await this.productRepository.findById(id);
            if (!existingProduct) {
                return {
                    success: false,
                    message: 'Product not found',
                };
            }

            this.validateUpdateProductRequest(productData);

            const updatedProduct = await this.productRepository.update(id, productData);

            return {
                success: true,
                message: 'Product updated successfully',
                data: this.mapProductToResponse(updatedProduct),
            };
        } catch (error: any) {
            return {
                success: false,
                message: this.getErrorMessage(error),
            };
        }
    }

    async deleteProduct(id: number): Promise<ProductDeleteResponse> {
        try {
            // Check if product exists
            const existingProduct = await this.productRepository.findById(id);
            if (!existingProduct) {
                return {
                    success: false,
                    message: 'Product not found',
                };
            }

            await this.productRepository.delete(id);

            return {
                success: true,
                message: 'Product deleted successfully',
            };
        } catch (error: any) {
            return {
                success: false,
                message: this.getErrorMessage(error),
            };
        }
    }

    private validateCreateProductRequest(request: CreateProductRequest): void {
        if (!request.name || request.name.trim().length === 0) {
            throw new Error('Product name is required');
        }

        if (!request.description || request.description.trim().length === 0) {
            throw new Error('Product description is required');
        }

        if (!request.price || request.price <= 0) {
            throw new Error('Product price must be greater than 0');
        }

        if (!request.type) {
            throw new Error('Product type is required');
        }

        if (request.photo && !this.isValidUrl(request.photo)) {
            throw new Error('Product photo must be a valid URL');
        }
    }

    private validateUpdateProductRequest(request: UpdateProductRequest): void {
        if (request.name !== undefined && (!request.name || request.name.trim().length === 0)) {
            throw new Error('Product name cannot be empty');
        }

        if (request.description !== undefined && (!request.description || request.description.trim().length === 0)) {
            throw new Error('Product description cannot be empty');
        }

        if (request.price !== undefined && request.price <= 0) {
            throw new Error('Product price must be greater than 0');
        }

        if (request.photo !== undefined && request.photo && !this.isValidUrl(request.photo)) {
            throw new Error('Product photo must be a valid URL');
        }
    }

    private isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    private mapProductToResponse(product: any): ProductResponse {
        return {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            photo: product.photo,
            restrictions: product.restrictions,
            sides: product.sides,
            admitsClarifications: product.admitsClarifications,
            type: product.type,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
        };
    }

    private getErrorMessage(error: any): string {
        if (error.code === 'P2002') {
            return 'A product with this name already exists';
        }
        if (error.code === 'P2025') {
            return 'Product not found';
        }
        return error.message || 'Internal server error';
    }
}
