import { Prisma } from '@prisma/client';
import { SideRepository } from '../repositories/side.repository.js';
import { SideDeleteResponse, SideListResponse, SideResponse } from '../models/Side.js';
import { CreateSideInputDTO, UpdateSideActiveInputDTO } from '../dto/side.dto.js';

type Side = Prisma.SideGetPayload<{}>;

export class SideService {
    private sideRepository: SideRepository;

    constructor() {
        this.sideRepository = new SideRepository();
    }

    async getAll(): Promise<SideListResponse> {
        try {
            const sides = await this.sideRepository.findAll();
            return {
                success: true,
                message: 'Sides retrieved successfully',
                data: sides.map(this.mapToResponse),
                total: sides.length
            };
        } catch (error: any) {
            return { success: false, message: error.message || 'Internal server error' };
        }
    }

    async getActive(): Promise<SideListResponse> {
        try {
            const sides = await this.sideRepository.findActive();
            return {
                success: true,
                message: 'Active sides retrieved successfully',
                data: sides.map(this.mapToResponse),
                total: sides.length
            };
        } catch (error: any) {
            return { success: false, message: error.message || 'Internal server error' };
        }
    }

    async deleteById(id: number): Promise<SideDeleteResponse> {
        try {
            const exists = await this.sideRepository.findById(id);
            if (!exists) {
                return { success: false, message: 'Side not found' };
            }
            await this.sideRepository.deleteById(id);
            return { success: true, message: 'Side deleted successfully' };
        } catch (error: any) {
            return { success: false, message: error.message || 'Internal server error' };
        }
    }

    async create(data: CreateSideInputDTO): Promise<{ success: boolean; message: string; data?: SideResponse; }> {
        try {
            if (!data.name || data.name.trim().length === 0) {
                return { success: false, message: 'Side name is required' };
            }
            const created = await this.sideRepository.create({ name: data.name.trim(), isActive: !!data.isActive });
            return { success: true, message: 'Side created successfully', data: this.mapToResponse(created) };
        } catch (error: any) {
            return { success: false, message: error.message || 'Internal server error' };
        }
    }

    private mapToResponse(side: Side): SideResponse {
        return {
            id: side.id,
            name: side.name,
            isActive: side.isActive
        };
    }

    async updateIsActive(id: number, body: UpdateSideActiveInputDTO): Promise<{ success: boolean; message: string; data?: SideResponse; }> {
        try {
            const exists = await this.sideRepository.findById(id);
            if (!exists) {
                return { success: false, message: 'Side not found' };
            }
            const updated = await this.sideRepository.updateIsActive(id, !!body.isActive);
            return { success: true, message: 'Side updated successfully', data: this.mapToResponse(updated) };
        } catch (error: any) {
            return { success: false, message: error.message || 'Internal server error' };
        }
    }
}

