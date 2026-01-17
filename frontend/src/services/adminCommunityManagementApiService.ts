import { AxiosError } from 'axios';
import API from "@/lib/api-client";
import { ADMIN_API_ROUTES } from "@/routes";

export const getAllCommunities = async (page: number = 1, limit: number = 10, search: string = "", status: string = "all", isVerified: string = "all") => {
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            search: search,
            status: status,
            isVerified: isVerified
        });

        const response = await API.get(`${ADMIN_API_ROUTES.COMMUNITY_MANAGEMENT_ALL}?${params.toString()}`);

        return {
            success: true,
            data: response.data.communities || [],
            total: response.data.total || 0,
            page: response.data.page || page,
            limit: response.data.limit || limit,
            totalPages: Math.ceil((response.data.total || 0) / limit),
            message: response.data.message
        };
    } catch (error) {
        const axiosError = error as AxiosError<unknown>;
        const errorData = axiosError.response?.data as Record<string, unknown>;
        console.error("Get all communities error:", errorData || axiosError.message);
        return {
            success: false,
            error: (errorData?.message as string) || axiosError.message || "Failed to fetch communities",
            data: [],
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 1
        };
    }
};

export const getCommunityById = async (id: string) => {
    try {
        const response = await API.get(ADMIN_API_ROUTES.COMMUNITY_MANAGEMENT_BY_ID(id));
        return {
            success: true,
            data: response.data.community,
            message: response.data.message
        };
    } catch (error) {
        const axiosError = error as AxiosError<unknown>;
        const errorData = axiosError.response?.data as Record<string, unknown>;
        console.error("Get community by id error:", errorData || axiosError.message);
        return {
            success: false,
            error: (errorData?.message as string) || axiosError.message || "Failed to fetch community",
        };
    }
}

export const updateCommunityStatus = async (id: string, status: string) => {
    try {
        const response = await API.patch(ADMIN_API_ROUTES.COMMUNITY_MANAGEMENT_UPDATE_STATUS(id), { status });
        return {
            success: true,
            data: response.data.community,
            message: response.data.message || "Status updated successfully"
        };
    } catch (error) {
        const axiosError = error as AxiosError<unknown>;
        const errorData = axiosError.response?.data as Record<string, unknown>;
        console.error("Update community status error:", errorData || axiosError.message);
        return {
            success: false,
            error: (errorData?.message as string) || axiosError.message || "Failed to update status",
        };
    }
}

export const updateVerificationStatus = async (id: string, isVerified: boolean) => {
    try {
        const response = await API.patch(ADMIN_API_ROUTES.COMMUNITY_MANAGEMENT_UPDATE_VERIFICATION(id), { isVerified });
        return {
            success: true,
            data: response.data.community,
            message: response.data.message || "Verification status updated successfully"
        };
    } catch (error) {
        const axiosError = error as AxiosError<unknown>;
        const errorData = axiosError.response?.data as Record<string, unknown>;
        console.error("Update verification status error:", errorData || axiosError.message);
        return {
            success: false,
            error: (errorData?.message as string) || axiosError.message || "Failed to update verification status",
        };
    }
}

export const deleteCommunity = async (id: string) => {
    try {
        const response = await API.delete(ADMIN_API_ROUTES.COMMUNITY_MANAGEMENT_DELETE(id));
        return {
            success: true,
            message: response.data.message || "Community deleted successfully"
        };
    } catch (error) {
        const axiosError = error as AxiosError<unknown>;
        const errorData = axiosError.response?.data as Record<string, unknown>;
        console.error("Delete community error:", errorData || axiosError.message);
        return {
            success: false,
            error: (errorData?.message as string) || axiosError.message || "Failed to delete community",
        };
    }
}

export const getCommunityMembers = async (id: string, page: number = 1, limit: number = 10, search: string = "") => {
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            search: search
        });
        const response = await API.get(`${ADMIN_API_ROUTES.COMMUNITY_MANAGEMENT_MEMBERS(id)}?${params.toString()}`);
        return {
            success: true,
            members: response.data.members || [],
            total: response.data.total || 0,
            page: response.data.page || page,
            limit: response.data.limit || limit,
            totalPages: Math.ceil((response.data.total || 0) / limit),
            message: response.data.message
        };
    } catch (error) {
        const axiosError = error as AxiosError<unknown>;
        const errorData = axiosError.response?.data as Record<string, unknown>;
        console.error("Get community members error:", errorData || axiosError.message);
        return {
            success: false,
            error: (errorData?.message as string) || axiosError.message || "Failed to fetch members",
        };
    }
}

export const updateCommunitySettings = async (id: string, settings: Record<string, unknown>) => {
    try {
        const response = await API.patch(ADMIN_API_ROUTES.COMMUNITY_MANAGEMENT_SETTINGS(id), { settings });
        return {
            success: true,
            data: response.data.community,
            message: response.data.message || "Settings updated successfully"
        };
    } catch (error) {
        const axiosError = error as AxiosError<unknown>;
        const errorData = axiosError.response?.data as Record<string, unknown>;
        console.error("Update community settings error:", errorData || axiosError.message);
        return {
            success: false,
            error: (errorData?.message as string) || axiosError.message || "Failed to update settings",
        };
    }
}
