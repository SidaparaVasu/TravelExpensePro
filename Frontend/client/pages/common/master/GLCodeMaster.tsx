import React, { useState, useEffect } from "react";
import { travelAPI } from "@/src/api/travel";
import { Layout } from "@/components/Layout";
import { FormModal } from "@/pages/common/reusables/Reusables";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Plus, Save, Edit2, Trash2, X } from "lucide-react";
import { check } from "prettier";

export default function GLCodeMasterPage() {
    const [glCode, setGLCode] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedGLCode, setSelectedGLCode] = useState(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const fetchGLCodes = async () => {
        try {
            const data = await travelAPI.getGLCodes();
            setGLCode(data.results);
        } catch (err) {
            console.error("Failed to fetch GL codes", err);
        }
    };

    useEffect(() => {
        fetchGLCodes();
    }, []);

    // Open modal for adding
    const handleAdd = () => {
        setSelectedGLCode(null);
        setIsFormOpen(true);
    };

    // Open modal for updating
    const handleEdit = (type) => {
        setSelectedGLCode(type);
        setIsFormOpen(true);
    };

    // Handle form submit (Add / Update)
    const handleSubmit = async (formData) => {
        try {
            if (selectedGLCode) {
                await travelAPI.updateGLCodes(selectedGLCode.id, formData);
            } else {
                await travelAPI.createGLCodes(formData);
            }
            setIsFormOpen(false);
            fetchGLCodes();
        } catch (err) {
            console.error("Failed to save GL Code", err);
        }
    };

    // Open delete confirmation
    const handleDelete = (gl) => {
        setSelectedGLCode(gl);
        setIsDeleteOpen(true);
    };

    // Confirm delete
    const confirmDelete = async () => {
        try {
            await travelAPI.deleteGLCode(selectedGLCode.id);
            setIsDeleteOpen(false);
            fetchGLCodes();
            setSelectedGLCode(null);
        } catch (err) {
            console.error("Failed to delete GL Code", err);
        }
    };

    const fields = [
        { name: "vertical_name", label: "Vertical Name", type: "text", required: true, maxLength: 100 },
        { name: "description", label: "Description", type: "textarea" },
        { name: "sorting_no", label: "Sorting No.", type: "number", required: true },
        { name: "gl_code", label: "GL Code", type: "text", required: true },
        { name: "is_active", label: "Active", type: "checkbox" },
    ];


    return (
        <Layout>
            <div className="p-6 bg-gray-50 min-h-screen">
                <header className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-slate-800">GL Code Master</h1>
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4" /> GL Code
                    </button>
                </header>

                <Card>
                    <CardHeader>
                        <CardTitle>GL Code List</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Sort no.</TableHead>
                                    <TableHead>GL Code</TableHead>
                                    <TableHead>Vertical Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-center">is Active</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {glCode.length > 0 ? (
                                    glCode.map((gl) => (
                                        <TableRow key={gl.id} className="border-b last:border-none">
                                            <TableCell>{gl.sorting_no}</TableCell>
                                            <TableCell>{gl.gl_code}</TableCell>
                                            <TableCell>{gl.vertical_name}</TableCell>
                                            <TableCell>{gl.description}</TableCell>
                                            <TableCell className="text-center">
                                                <input type="checkbox" className="accent-blue-600" checked={gl.is_active} readOnly />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(gl)}
                                                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(gl)}
                                                        className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )))
                                    : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center text-gray-500">
                                                No GL Code found.
                                            </TableCell>
                                        </TableRow>
                                    )
                                }
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Add / Edit Modal */}
                <FormModal
                    title={selectedGLCode ? "Update GL Code" : "Add New GL Code"}
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    fields={fields}
                    initialData={selectedGLCode || {}}
                    onSubmit={handleSubmit}
                />

                {/* Delete Confirmation Modal */}
                {
                    isDeleteOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
                                <h2 className="text-lg font-semibold text-slate-800 mb-4">
                                    Confirm Delete
                                </h2>
                                <p className="text-sm text-slate-600 mb-6">
                                    Are you sure you want to delete <strong>{selectedGLCode.gl_code}</strong>?
                                </p>
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setIsDeleteOpen(false)}
                                        className="px-4 py-2 text-sm text-slate-600 hover:bg-gray-100 rounded-md"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >
        </Layout >
    )
}