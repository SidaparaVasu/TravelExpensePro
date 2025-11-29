import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, X, Check, AlertCircle } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

import { expenseAPI } from "@/src/api/expense";

type ClaimStatusRow = {
  id: number;
  code: string;
  label: string;
  sequence: number;
  is_terminal: boolean;
};

type FormState = {
  code: string;
  label: string;
  sequence: number | "";
  is_terminal: boolean;
};

const ClaimStatusMaster: React.FC = () => {
  const { toast } = useToast();

  const [statuses, setStatuses] = useState<ClaimStatusRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<FormState>({
    code: "",
    label: "",
    sequence: "",
    is_terminal: false,
  });

  const [editTarget, setEditTarget] = useState<ClaimStatusRow | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ClaimStatusRow | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);

  // ---- Data load ----
  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const res = await expenseAPI.claimStatus.getAll();
      const items = (res && (res.data as ClaimStatusRow[])) || [];
      setStatuses(items);
    } catch (error: any) {
      showNotification("Failed to load claim statuses.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const showNotification = (message: string, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ---- Helpers ----
  const openCreate = () => {
    setEditTarget(null);

    const nextSeq =
      statuses.length > 0
        ? Math.max(...statuses.map((s) => Number(s.sequence || 0))) + 1
        : 1;

    setForm({
      code: "",
      label: "",
      sequence: nextSeq,
      is_terminal: false,
    });
    setIsFormOpen(true);
  };

  const openEdit = (row: ClaimStatusRow) => {
    setEditTarget(row);
    setForm({
      code: row.code,
      label: row.label,
      sequence: row.sequence,
      is_terminal: row.is_terminal,
    });
    setIsFormOpen(true);
  };

  const openDelete = (row: ClaimStatusRow) => {
    setDeleteTarget(row);
    setIsDeleteOpen(true);
  };

  const closeModal = () => {
    setIsFormOpen(false);
    setEditTarget(null);
    setForm({
      code: "",
      label: "",
      sequence: "",
      is_terminal: false,
    });
  };

  const handleFormChange =
    (field: keyof FormState) =>
    (value: string | boolean) => {
      setForm((prev) => ({
        ...prev,
        [field]: field === "sequence" ? (value === "" ? "" : Number(value)) : value,
      }));
    };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.label || (!editTarget && !form.code)) {
      showNotification("Code and Label are required.", "error");
      return;
    }

    if (!form.sequence || Number(form.sequence) <= 0) {
      showNotification("Sequence must be a positive number.", "error");
      return;
    }

    const payload = {
      code: form.code.trim(),
      label: form.label.trim(),
      sequence: Number(form.sequence),
      is_terminal: form.is_terminal,
    };

    try {
      setSubmitting(true);

      if (editTarget) {
        await expenseAPI.claimStatus.update(editTarget.id, payload);
        showNotification("Claim status updated successfully.");
      } else {
        await expenseAPI.claimStatus.create(payload);
        showNotification("Claim status added successfully.");
      }

      closeModal();
      await fetchStatuses();
    } catch (error: any) {
      showNotification("Unable to save claim status. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await expenseAPI.claimStatus.delete(deleteTarget.id);
      showNotification(`Status "${deleteTarget.label}" deleted.`);
      setIsDeleteOpen(false);
      setDeleteTarget(null);
      await fetchStatuses();
    } catch (error: any) {
      showNotification("Unable to delete status. Ensure it is not in use.", "error");
    } finally {
      setDeleting(false);
    }
  };

  // ---- Sorted statuses ----
  const sortedStatuses = [...statuses].sort((a, b) => {
    if (a.sequence === b.sequence) {
      return a.label.localeCompare(b.label);
    }
    return Number(a.sequence) - Number(b.sequence);
  });

  // ---- UI helpers ----
  const renderTerminalBadge = (row: ClaimStatusRow) => {
    if (row.is_terminal) {
      return (
        <span className="px-2.5 py-1 rounded-full border-dashed text-xs font-medium bg-emerald-100 text-emerald-700">
          Terminal
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        Intermediate
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
            notification.type === "success" ? "bg-green-500" : "bg-red-500"
          } text-white animate-fade-in`}
        >
          {notification.type === "success" ? <Check size={20} /> : <AlertCircle size={20} />}
          {notification.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
              Claim Status Master
            </h1>
            <p className="text-slate-600">
              Maintain the lifecycle statuses used across all expense claims.
            </p>
          </div>

          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Add Status</span>
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-slate-600">Loading...</p>
            </div>
          ) : sortedStatuses.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-600">No statuses found. Add a new status to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Label
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Sequence
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedStatuses.map((row, idx) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        row.is_terminal ? "bg-emerald-50/40" : ""
                      }`}
                    >
                      <td className="px-6 py-4 text-xs text-slate-500">{idx + 1}</td>
                      <td className="px-6 py-4 font-mono text-xs uppercase text-slate-900">
                        {row.code}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">{row.label}</td>
                      <td className="px-6 py-4 text-center text-slate-700">{row.sequence}</td>
                      <td className="px-6 py-4 text-center">{renderTerminalBadge(row)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(row)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => openDelete(row)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create / Edit Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">
                  {editTarget ? "Edit Claim Status" : "Add Claim Status"}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Code */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Code *
                    </label>
                    <input
                      type="text"
                      value={form.code}
                      onChange={(e) => handleFormChange("code")(e.target.value)}
                      placeholder="e.g. manager_pending"
                      disabled={!!editTarget}
                      required={!editTarget}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                    />
                    {!editTarget && (
                      <p className="text-xs text-slate-500 mt-1.5">
                        Use lowercase and underscores. This is referenced in code and cannot be
                        changed later.
                      </p>
                    )}
                  </div>

                  {/* Label */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Label *
                    </label>
                    <input
                      type="text"
                      value={form.label}
                      onChange={(e) => handleFormChange("label")(e.target.value)}
                      placeholder="e.g. Manager Pending"
                      required
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Sequence */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Sequence *
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={form.sequence}
                      onChange={(e) => handleFormChange("sequence")(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-slate-500 mt-1.5">
                      Lower numbers are evaluated earlier in workflows.
                    </p>
                  </div>
                </div>

                {/* Terminal Status Toggle */}
                <div className="mt-6">
                  <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.is_terminal}
                      onChange={(e) => handleFormChange("is_terminal")(e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-slate-700 font-medium block">Terminal status</span>
                      <span className="text-xs text-slate-500">
                        Terminal statuses end the claim lifecycle (Approved, Rejected, Closed).
                      </span>
                    </div>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-8 pt-6 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Saving..." : editTarget ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {isDeleteOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Confirm Delete</h3>
                <button
                  onClick={() => setIsDeleteOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-slate-600 mb-6">
                Are you sure you want to permanently delete{" "}
                <span className="font-semibold">{deleteTarget?.label || "this status"}</span>?
                Ensure it is not referenced in any active claims.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsDeleteOpen(false)}
                  className="px-4 py-2 rounded-md text-sm text-slate-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="px-4 py-2 rounded-md text-sm bg-red-600 text-white hover:bg-red-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4" /> {deleting ? "Deleting..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaimStatusMaster;