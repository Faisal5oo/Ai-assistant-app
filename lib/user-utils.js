const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  return EMAIL_REGEX.test(email);
}

/**
 * Normalize Google profile photo URLs to a higher resolution when a size token is present.
 * @param {string | undefined} avatar
 * @returns {string}
 */
export function toHighResAvatarUrl(avatar) {
  if (!avatar || typeof avatar !== "string") {
    return "";
  }
  if (avatar.includes("googleusercontent.com")) {
    return avatar.replace(/=s\d+(-c)?/, "=s400$1");
  }
  return avatar;
}

/**
 * @param {import('mongoose').Document} user
 */
export function toPublicUser(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    avatar: user.avatar || "",
    createdAt: user.createdAt,
  };
}
