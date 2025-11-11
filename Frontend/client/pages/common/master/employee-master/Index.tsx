import React, { useState } from 'react';
import EmployeeList from './EmployeeList';
import EmployeeForm from './EmployeeForm';

const EmployeeMaster: React.FC = () => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editId, setEditId] = useState<number | null>(null);

  const handleEdit = (id: number | null) => {
    setEditId(id);
    setView('form');
  };

  const handleBackToList = () => {
    setView('list');
    setEditId(null);
  };

  return (
    <div>
      {view === 'list' ? (
        <EmployeeList onEdit={handleEdit} />
      ) : (
        <EmployeeForm editId={editId} onCancel={handleBackToList} />
      )}
    </div>
  );
};

export default EmployeeMaster;