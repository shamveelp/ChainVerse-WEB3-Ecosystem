import {
    GetCommunityMembersDto,
    UpdateMemberRoleDto,
    BanMemberDto,
    CommunityMembersListResponseDto,
    MemberActionResponseDto,
    MemberDetailResponseDto,
    BulkUpdateMembersDto,
    RemoveMemberResponseDto,
    MemberActivityResponseDto,
    BulkUpdateMembersResponseDto
} from "../../../../dtos/communityAdmin/CommunityAdminMembers.dto";

export interface ICommunityAdminMembersService {
    getCommunityMembers(adminId: string, filters: GetCommunityMembersDto): Promise<CommunityMembersListResponseDto>;
    getMemberDetails(adminId: string, memberId: string): Promise<MemberDetailResponseDto>;
    updateMemberRole(adminId: string, data: UpdateMemberRoleDto): Promise<MemberActionResponseDto>;
    banMember(adminId: string, data: BanMemberDto): Promise<MemberActionResponseDto>;
    unbanMember(adminId: string, memberId: string): Promise<MemberActionResponseDto>;
    removeMember(adminId: string, memberId: string, reason?: string): Promise<RemoveMemberResponseDto>;
    getMemberActivity(adminId: string, memberId: string, period?: string): Promise<MemberActivityResponseDto>;
    bulkUpdateMembers(adminId: string, data: BulkUpdateMembersDto): Promise<BulkUpdateMembersResponseDto>;
}
