// export const hasRole = (roleName: string): boolean => {
//     const rolesData = JSON.parse(localStorage.getItem("roles") || "{}");
//     const availableRoles = rolesData.available || [];
//     return availableRoles.some(role => role.name === roleName);
// };

export const hasRole = (roleName: string): boolean => {
  try {
    const roles = JSON.parse(localStorage.getItem("roles") || "[]");
    return roles.some((role: any) => 
      (role.name || '').toLowerCase() === roleName.toLowerCase()
    );
  } catch {
    return false;
  }
};

export const hasRoleType = (roleType: string): boolean => {
  try {
    const roles = JSON.parse(localStorage.getItem("roles") || "[]");
    return roles.some((role: any) => 
      (role.role_type || '').toLowerCase() === roleType.toLowerCase()
    );
  } catch {
    return false;
  }
};

export const getPrimaryRole = () => {
  try {
    const roles = JSON.parse(localStorage.getItem("roles") || "[]");
    return roles.find((role: any) => role.is_primary);
  } catch {
    return null;
  }
};