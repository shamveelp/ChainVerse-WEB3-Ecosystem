import API from "@/lib/axios"

export const getUsers = async (page: number, limit: number = 7, search: string = "") => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search: search
  })
  const res = await API.get(`/api/admin/users?${params.toString()}`)
  console.log(res.data)
  return res.data
}

export const toggleUserBan = async (userId: string, isBanned: boolean) => {
  await API.patch(`/api/admin/users/${userId}`, { isBanned })
  const res = await API.get(`/api/admin/users/${userId}`)
  return res.data
}

export const getUserById = async (id: string) => {
  const res = await API.get(`/api/admin/users/${id}`)
  return res.data
}

export const toggleUserBlock = async (userId: string, isBlocked: boolean) => {
  await API.patch(`/api/admin/users/${userId}`, { isBlocked })
  const res = await API.get(`/api/admin/users/${userId}`)
  return res.data
}

export const updateUserPoints = async (userId: string, points: number) => {
  const res = await API.patch(`/api/admin/users/${userId}/points`, { points })
  return res.data
}
