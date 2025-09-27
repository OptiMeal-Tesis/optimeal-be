import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

// Client for public operations (authentication, public data)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;

export class SupabaseService {
    /**
     * Upload file to Supabase Storage
     */
    static async uploadFile(
        file: Express.Multer.File, 
        bucket: string = 'products',
        folder: string = 'images'
    ): Promise<{ url: string; path: string }> {
        if (!supabaseAdmin) {
            throw new Error('Supabase admin client not configured');
        }

        try {
            // Generate unique filename
            const fileExtension = file.originalname.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
            const filePath = `${folder}/${fileName}`;

            // Upload file
            const { data, error } = await supabaseAdmin.storage
                .from(bucket)
                .upload(filePath, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false
                });

            if (error) {
                throw new Error(`Upload failed: ${error.message}`);
            }

            // Get public URL
            const { data: urlData } = supabaseAdmin.storage
                .from(bucket)
                .getPublicUrl(filePath);

            return {
                url: urlData.publicUrl,
                path: filePath
            };
        } catch (error) {
            console.error('Error uploading file to Supabase:', error);
            throw new Error('Failed to upload file to Supabase');
        }
    }

    /**
     * Delete file from Supabase Storage
     */
    static async deleteFile(bucket: string, path: string): Promise<void> {
        if (!supabaseAdmin) {
            throw new Error('Supabase admin client not configured');
        }

        try {
            const { error } = await supabaseAdmin.storage
                .from(bucket)
                .remove([path]);

            if (error) {
                throw new Error(`Delete failed: ${error.message}`);
            }
        } catch (error) {
            console.error('Error deleting file from Supabase:', error);
            throw new Error('Failed to delete file from Supabase');
        }
    }

    /**
     * Check if URL is a Supabase Storage URL
     */
    static isSupabaseUrl(url: string): boolean {
        return url.includes('supabase.co') && url.includes('/storage/v1/object/public/');
    }

    /**
     * Extract file path from Supabase Storage URL
     */
    static extractPathFromUrl(url: string): string | null {
        if (!this.isSupabaseUrl(url)) {
            return null;
        }

        const match = url.match(/\/storage\/v1\/object\/public\/[^\/]+\/(.+)$/);
        return match ? match[1] : null;
    }
}

