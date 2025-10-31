export const hasRole = (roleName: string): boolean => {
    const rolesData = JSON.parse(localStorage.getItem("roles") || "{}");
    const availableRoles = rolesData.available || [];
    return availableRoles.some(role => role.name === roleName);
};