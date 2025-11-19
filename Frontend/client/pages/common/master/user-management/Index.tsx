import React, { useState } from 'react';
import UserList from './UserList';
import UserDetailModal from './UserDetailModal';
import UserFormModal from './UserFormModal';

export type UserTypeFilter = 'all' | 'organizational' | 'external';

const UserManagement: React.FC = () => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleView = (userId: number) => {
    setSelectedUserId(userId);
    setShowDetailModal(true);
  };

  const handleEdit = (userId: number) => {
    setSelectedUserId(userId);
    setEditMode(true);
    setShowFormModal(true);
  };

  const handleCreate = () => {
    setSelectedUserId(null);
    setEditMode(false);
    setShowFormModal(true);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedUserId(null);
  };

  const handleCloseForm = () => {
    setShowFormModal(false);
    setSelectedUserId(null);
    setEditMode(false);
  };

  const handleFormSuccess = () => {
    handleCloseForm();
    setRefreshTrigger((prev) => prev + 1); // Trigger list refresh
  };

  return (
    <div>
      <UserList
        onView={handleView}
        onEdit={handleEdit}
        onCreate={handleCreate}
        refreshTrigger={refreshTrigger}
      />

      {showDetailModal && selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          isOpen={showDetailModal}
          onClose={handleCloseDetail}
        />
      )}

      {showFormModal && (
        <UserFormModal
          userId={selectedUserId}
          isOpen={showFormModal}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

export default UserManagement;