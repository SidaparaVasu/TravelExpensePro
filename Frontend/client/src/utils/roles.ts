// export const hasRole = (roleName: string): boolean => {
//     const rolesData = JSON.parse(localStorage.getItem("roles") || "{}");
//     const availableRoles = rolesData.available || [];
//     return availableRoles.some(role => role.name === roleName);
// };

export const hasRole = (roleName: string): boolean => {
  try {
    const rolesData = JSON.parse(localStorage.getItem("roles") || "{}");
    const availableRoles = rolesData.available || [];
    return availableRoles.some((role: any) => (role.name || '').toLowerCase() === roleName.toLowerCase());
  } catch {
    return false;
  }
};