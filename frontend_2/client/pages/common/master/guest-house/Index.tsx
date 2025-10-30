import React, { useState } from 'react';
import GuestHouseForm from "@/pages/common/master/guest-house/GuestHouseForm";
import GuestHouseList from "@/pages/common/master/guest-house/GuestHouseList";

function GuestHouseMaster() {
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [editId, setEditId] = useState(null);

  const handleEdit = (id) => {
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
        <GuestHouseList onEdit={handleEdit} />
      ) : (
        <GuestHouseForm editId={editId} onCancel={handleBackToList} />
      )}
    </div>
  );
}

export default GuestHouseMaster;