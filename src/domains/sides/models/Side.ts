export interface SideResponse {
    id: number;
    name: string;
    isActive: boolean;
}

export interface SideListResponse {
    success: boolean;
    message: string;
    data?: SideResponse[];
    total?: number;
}

export interface SideDeleteResponse {
    success: boolean;
    message: string;
}

