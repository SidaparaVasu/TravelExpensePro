export const docViewer = {
    viewFile: async (filePath: string) => {
        return `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/file/?path=${encodeURIComponent(filePath)}`;
    },
    onViewFile: async (path: string) => {
        const viewerUrl = await docViewer.viewFile(path);
        window.open(viewerUrl, "_blank");
    }
}