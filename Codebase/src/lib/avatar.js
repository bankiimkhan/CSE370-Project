export const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/initials/svg?seed=UniTask%20User&backgroundColor=d1fae5,bfdbfe,fee2e2,fef3c7'

export function getAvatarUrl(profilePicture) {
  return profilePicture || DEFAULT_AVATAR
}
