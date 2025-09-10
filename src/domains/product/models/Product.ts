import { ProductTypeEnum, RestrictionEnum } from '@prisma/client';

export interface CreateProductRequest {
    name: string;
    description: string;
    price: number;
    photo?: string;
    restrictions: RestrictionEnum[];
    sides: string[];
    admitsClarifications: boolean;
    type: ProductTypeEnum;
    stock: number;
}

export interface UpdateProductRequest {
    name?: string;
    description?: string;
    price?: number;
    photo?: string;
    restrictions?: RestrictionEnum[];
    sides?: string[];
    admitsClarifications?: boolean;
    type?: ProductTypeEnum;
    stock?: number;
}

export interface ProductResponse {
    id: number;
    name: string;
    description: string;
    price: number;
    photo?: string;
    restrictions: RestrictionEnum[];
    sides: string[];
    admitsClarifications: boolean;
    type: ProductTypeEnum;
    stock: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProductListResponse {
    success: boolean;
    message: string;
    data?: ProductResponse[];
    total?: number;
}

export interface ProductSingleResponse {
    success: boolean;
    message: string;
    data?: ProductResponse;
}

export interface ProductCreateResponse {
    success: boolean;
    message: string;
    data?: {
        id: number;
        name: string;
        type: ProductTypeEnum;
    };
}

export interface ProductUpdateResponse {
    success: boolean;
    message: string;
    data?: ProductResponse;
}

export interface ProductDeleteResponse {
    success: boolean;
    message: string;
}
